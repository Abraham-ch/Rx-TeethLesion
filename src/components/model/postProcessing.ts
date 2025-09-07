import { classColors, Detection, labels, ProcessResultsProps } from '../../types/results';

// Función mejorada para procesar resultados YOLO
export const processYOLOResults = ( props : ProcessResultsProps ): Detection[] => {
  const { output, modelWidth, modelHeight, imageWidth, imageHeight } = props;
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
export const applyNMS = (detections: Detection[], iouThreshold: number = 0.45): Detection[] => {
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