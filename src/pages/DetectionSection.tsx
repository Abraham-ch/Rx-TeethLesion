import { 
  FileImage, 
  Eye, 
  EyeOff, 
  Play, 
  Layers, 
  Download, 
  Trash2 
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Detection } from '../types/results';
import { 
  handleImageUpload as handleImageUploadUtil, 
  drawDetections as drawDetectionsUtil 
} from '../components/model/handleUpload';
import { handleProcess as handleProcessUtil } from '../components/model/handleProcess';

export const DetectionSection = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMasks, setShowMasks] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUploadUtil(event, {
      setUploadedImage,
      setDetections,
      setImageDimensions
    });
  };

  const drawDetections = (detections: Detection[]) => {
    drawDetectionsUtil({
      detections,
      canvasRef,
      imageRef,
      showMasks,
      imageDimensions
    });
  };

  const handleProcess = async () => {
    await handleProcessUtil({
      uploadedImage,
      setDetections,
      setIsProcessing,
      imageDimensions,
      canvasRef,
      imageRef,
      showMasks
    });
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
        <div className="rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Controles</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargar Imagen
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors aspect-[5/4]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden size-full"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer size-full flex flex-col items-center justify-center">
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
        
        <div className="lg:col-span-2 rounded-xl border border-gray-200 p-6">
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
              <div className="relative size-full">
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