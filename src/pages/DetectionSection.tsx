import { FileImage, Eye, EyeOff, Play, Layers, Download, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { imageToTensor } from '../components/model/imageToTensor';
import { runONNX } from '../utils/onnxRunner';

const labels = [
  "Caries",
  "Periapical Lesion", 
  "Impacted Tooth"
];

const classColors = [
  '#FF3838', // Rojo para Caries
  '#FF9D97', // Rosa para Periapical Lesion  
  '#FF701F', // Naranja para Impacted Tooth
];

interface Detection {
  className: string;
  class: number;
  confidence: number;
  bbox: [number, number, number, number];
  color: string;
}

// Función mejorada para procesar resultados YOLO
const processYOLOResults = (
  output: Float32Array,
  modelWidth: number,
  modelHeight: number,
  imageWidth: number,
  imageHeight: number
): Detection[] => {
  const detections: Detection[] = [];
  const numClasses = labels.length; // 3 clases
  
  console.log('📊 Procesando resultados YOLO...');
  console.log(`Output length: ${output.length}`);
  console.log(`Primeros 20 valores:`, Array.from(output).slice(0, 20));
  
  // Analizar el formato del output
  const totalElements = output.length;
  console.log(`Total elementos: ${totalElements}`);
  
  // YOLOv11 típicamente devuelve formato [1, 7, 8400] o [1, 8400, 7]
  // Donde 7 = 4 coordenadas + 3 clases
  const expectedElements = 4 + numClasses; // 7 elementos por detección
  
  let numDetections: number;
  let isTransposed = false;
  
  // Detectar formato automáticamente
  if (totalElements === 58800) { // 8400 * 7
    // Comprobar si es formato [8400, 7] o [7, 8400]
    // Si los primeros valores son muy altos, probablemente sea [7, 8400] (transpuesto)
    const sampleValues = Array.from(output).slice(0, 10);
    const avgValue = sampleValues.reduce((a, b) => a + b, 0) / sampleValues.length;
    
    if (avgValue > 10) {
      // Probablemente formato transpuesto [7, 8400]
      numDetections = 8400;
      isTransposed = true;
      console.log('🔄 Detectado formato transpuesto [7, 8400]');
    } else {
      // Formato normal [8400, 7]
      numDetections = 8400;
      console.log('✅ Detectado formato normal [8400, 7]');
    }
  } else {
    console.error('❌ Formato de output no reconocido');
    return [];
  }

  // Calcular ratios de escala para convertir coordenadas del modelo a la imagen original
  const scaleX = imageWidth / modelWidth;
  const scaleY = imageHeight / modelHeight;
  
  console.log(`Escalas: X=${scaleX}, Y=${scaleY}`);

  for (let i = 0; i < numDetections; i++) {
    let centerX, centerY, width, height;
    let classScores: number[] = [];
    
    if (isTransposed) {
      // Formato [7, 8400]: cada fila contiene todos los valores para esa característica
      centerX = output[i];                    // fila 0
      centerY = output[numDetections + i];    // fila 1  
      width = output[2 * numDetections + i];  // fila 2
      height = output[3 * numDetections + i]; // fila 3
      
      // Clases en las filas 4, 5, 6
      for (let c = 0; c < numClasses; c++) {
        classScores.push(output[(4 + c) * numDetections + i]);
      }
    } else {
      // Formato [8400, 7]: cada fila contiene una detección completa
      const startIdx = i * expectedElements;
      centerX = output[startIdx];
      centerY = output[startIdx + 1]; 
      width = output[startIdx + 2];
      height = output[startIdx + 3];
      
      classScores = Array.from(output.slice(startIdx + 4, startIdx + 4 + numClasses));
    }
    
    // Debug para las primeras detecciones
    if (i < 5) {
      console.log(`Detección ${i}:`, {
        centerX, centerY, width, height,
        classScores: classScores.map(s => s.toFixed(3))
      });
    }
    
    // Encontrar la clase con mayor puntuación
    let maxScore = Math.max(...classScores);
    let maxClassIdx = classScores.indexOf(maxScore);
    
    // Aplicar sigmoid si las puntuaciones están en logits (valores muy altos/bajos)
    if (maxScore > 10 || maxScore < -10) {
      classScores = classScores.map(score => 1 / (1 + Math.exp(-score)));
      maxScore = Math.max(...classScores);
      maxClassIdx = classScores.indexOf(maxScore);
    }
    
    // Filtrar detecciones con baja confianza
    const confidenceThreshold = 0.5; // Aumentar umbral para reducir falsos positivos
    if (maxScore < confidenceThreshold) {
      continue;
    }
    
    // Validar coordenadas (deben estar en rango razonable)
    if (centerX < 0 || centerX > modelWidth || 
        centerY < 0 || centerY > modelHeight ||
        width <= 0 || width > modelWidth ||
        height <= 0 || height > modelHeight) {
      continue;
    }
    
    // Convertir de center_x, center_y, width, height a x, y, width, height (esquina superior izquierda)
    let x = centerX - width / 2;
    let y = centerY - height / 2;
    
    // Asegurar que las coordenadas estén dentro de los límites
    x = Math.max(0, Math.min(x, modelWidth - width));
    y = Math.max(0, Math.min(y, modelHeight - height));
    width = Math.min(width, modelWidth - x);
    height = Math.min(height, modelHeight - y);
    
    // Escalar coordenadas a las dimensiones originales de la imagen
    const scaledBox: [number, number, number, number] = [
      Math.floor(x * scaleX),
      Math.floor(y * scaleY), 
      Math.floor(width * scaleX),
      Math.floor(height * scaleY)
    ];
    
    // Validar que el bbox escalado sea razonable
    if (scaledBox[2] < 5 || scaledBox[3] < 5 || 
        scaledBox[2] > imageWidth || scaledBox[3] > imageHeight) {
      continue;
    }

    detections.push({
      className: labels[maxClassIdx],
      class: maxClassIdx,
      confidence: maxScore,
      bbox: scaledBox,
      color: classColors[maxClassIdx] || '#6b7280'
    });
  }

  console.log(`✅ Detecciones válidas: ${detections.length}`);
  
  // Mostrar estadísticas de las detecciones
  const stats = detections.reduce((acc, det) => {
    acc[det.className] = (acc[det.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📈 Estadísticas por clase:', stats);
  
  return detections;
};

// Aplicar Non-Maximum Suppression (NMS) simple
const applyNMS = (detections: Detection[], iouThreshold: number = 0.45): Detection[] => {
  if (detections.length === 0) return detections;

  // Ordenar por confianza (mayor a menor)
  const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);
  const keep: Detection[] = [];

  // Función para calcular IoU
  const calculateIoU = (box1: number[], box2: number[]): number => {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const intersectionX = Math.max(x1, x2);
    const intersectionY = Math.max(y1, y2);
    const intersectionW = Math.min(x1 + w1, x2 + w2) - intersectionX;
    const intersectionH = Math.min(y1 + h1, y2 + h2) - intersectionY;

    if (intersectionW <= 0 || intersectionH <= 0) return 0;

    const intersectionArea = intersectionW * intersectionH;
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  };

  for (const detection of sortedDetections) {
    let shouldKeep = true;

    for (const keptDetection of keep) {
      const iou = calculateIoU(detection.bbox, keptDetection.bbox);
      if (iou > iouThreshold) {
        shouldKeep = false;
        break;
      }
    }

    if (shouldKeep) {
      keep.push(detection);
    }
  }

  return keep;
};

export const DetectionSection = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMasks, setShowMasks] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setUploadedImage(result);
        setDetections([]);
        
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = result;
      }
    };

    reader.readAsDataURL(file);
  };

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = image.offsetWidth;
    canvas.height = image.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!showMasks) return;
    
    const scaleX = image.offsetWidth / imageDimensions.width;
    const scaleY = image.offsetHeight / imageDimensions.height;
    
    // Renderizar bounding boxes (basado en el código de referencia)
    const font = `${Math.max(Math.round(Math.max(canvas.width, canvas.height) / 40), 14)}px Arial`;
    ctx.font = font;
    ctx.textBaseline = "top";
    
    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox;
      const color = detection.color;
      
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;
      
      // Dibujar bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(Math.min(canvas.width, canvas.height) / 200, 2.5);
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // Dibujar etiqueta
      const label = `${detection.className} - ${(detection.confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = color;
      
      const textWidth = ctx.measureText(label).width;
      const textHeight = parseInt(font, 10);
      const yText = scaledY - (textHeight + ctx.lineWidth);
      
      // Fondo de la etiqueta
      ctx.fillRect(
        scaledX - 1,
        yText < 0 ? 0 : yText,
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth
      );
      
      // Texto de la etiqueta
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, scaledX - 1, yText < 0 ? 1 : yText + 1);
    });
  };

  const handleProcess = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    try {
      console.log('🔄 Procesando imagen...');
      const inputTensor = await imageToTensor(uploadedImage);
      const result = await runONNX(inputTensor.data as Float32Array);
      console.log('🔍 ANÁLISIS DEL OUTPUT DEL MODELO:');
      console.log('Longitud total:', result.length);
      console.log('Primeros 20 valores:', Array.from(result as Float32Array).slice(0, 20));
      console.log('📊 Resultado del modelo:', {
        length: result.length,
        type: typeof result,
        firstValues: Array.from(result as Float32Array).slice(0, 10)
      });
      
      const possibleFormats = [
        { name: 'Formato 1', dims: [1, 8400, 7], total: 58800 },
        { name: 'Formato 2', dims: [1, 7, 8400], total: 58800 },
        { name: 'Formato 3', dims: [8400, 7], total: 58800 },
        { name: 'Formato 4', dims: [1, 3, 8400], total: 25200 }, // Solo coordenadas + clases por separado
      ];
      
      possibleFormats.forEach(format => {
        if (format.total === result.length) {
          console.log(`✅ POSIBLE FORMATO: ${format.name} - Dimensiones: ${format.dims.join('x')}`);
        }
      });
    
      // Procesar resultados con la nueva función
      const rawDetections = processYOLOResults(
        result as Float32Array,
        640, // modelWidth
        640, // modelHeight
        imageDimensions.width,
        imageDimensions.height
      );
      
      // Aplicar NMS para eliminar detecciones duplicadas
      const finalDetections = applyNMS(rawDetections, 0.45);
      
      setDetections(finalDetections);
      console.log('✅ Detecciones finales:', finalDetections);
      
      setTimeout(() => drawDetections(finalDetections), 100);
      
    } catch (error) {
      console.error('❌ Error al procesar la imagen:', error);
    }
    setIsProcessing(false);
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
    setTimeout(() => drawDetections(detections), 50);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detección de Objetos Dentales</h2>
        <p className="text-gray-600">Carga una imagen radiográfica para detectar caries, lesiones periapicales y dientes impactados</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Controles</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargar Imagen
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FileImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click para subir imagen</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Mostrar Detecciones</span>
              <button
                onClick={toggleMasks}
                className={`p-2 rounded-lg ${showMasks ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
              >
                {showMasks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              onClick={handleProcess}
              disabled={!uploadedImage || isProcessing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Detectar Objetos
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Imagen y Resultados</h3>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Layers className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => {
                  setUploadedImage(null);
                  setDetections([]);
                }}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-lg aspect-video flex items-center justify-center relative">
            {uploadedImage ? (
              <div className="relative w-full h-full">
                <img
                  ref={imageRef}
                  src={uploadedImage}
                  alt="Imagen cargada"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onLoad={() => setTimeout(() => drawDetections(detections), 100)}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    transform: 'translate(50%, 50%) translate(-50%, -50%)'
                  }}
                />
              </div>
            ) : (
              <div className="text-center">
                {// svg
}
                <p className="text-gray-500">No hay imagen cargada</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Detecciones Encontradas {detections.length > 0 && `(${detections.length})`}
        </h3>
        
        {detections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detections.map((detection, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: detection.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{detection.className}</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Confianza: {(detection.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Posición: ({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])})
                </div>
                <div className="text-xs text-gray-500">
                  Tamaño: {Math.round(detection.bbox[2])} × {Math.round(detection.bbox[3])}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              {uploadedImage ? '🔍 Procesa la imagen para ver las detecciones' : '📷 Carga una imagen para comenzar'}
            </div>
            <p className="text-xs text-gray-500">
              El modelo usa un umbral de confianza fijo de 0.25
            </p>
          </div>
        )}
      </div>
    </div>
  );
};