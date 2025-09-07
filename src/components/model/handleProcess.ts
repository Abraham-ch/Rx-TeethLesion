import { Detection } from "../../types/results";
import { runONNX } from "../../utils/onnxRunner";
import { drawDetections } from "./handleUpload";
import { imageToTensor } from "./imageToTensor";
import { applyNMS, processYOLOResults } from "./postProcessing";

type Props = {
  uploadedImage: string | null;
  setDetections: (detections: Detection[]) => void;
  setIsProcessing: (processing: boolean) => void;
  imageDimensions: { width: number; height: number };
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  showMasks: boolean;
}

export const handleProcess = async ( props : Props ) => {
  const { 
    uploadedImage, 
    setDetections, 
    setIsProcessing, 
    imageDimensions,
    canvasRef,
    imageRef,
    showMasks
  } = props;

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
    const rawDetections = processYOLOResults({
      output: result as Float32Array,
      modelWidth: 640,
      modelHeight: 640,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height
    });
    
    // Aplicar NMS para eliminar detecciones duplicadas
    const finalDetections = applyNMS(rawDetections, 0.45);
    
    setDetections(finalDetections);
    console.log('✅ Detecciones finales:', finalDetections);
    
    setTimeout(() => drawDetections({
      detections: finalDetections,
      canvasRef,
      imageRef,
      showMasks,
      imageDimensions
    }), 100);
    
  } catch (error) {
    console.error('❌ Error al procesar la imagen:', error);
  }
  setIsProcessing(false);
};