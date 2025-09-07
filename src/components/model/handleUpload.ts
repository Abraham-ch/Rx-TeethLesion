import { Detection } from '../../types/results';

type HandleImageUploadProps = {
  setUploadedImage: (image: string | null) => void;
  setDetections: (detections: Detection[]) => void;
  setImageDimensions: (dimensions: { width: number; height: number }) => void;
}

export const handleImageUpload = (
  event: React.ChangeEvent<HTMLInputElement>,
  { setUploadedImage, setDetections, setImageDimensions }: HandleImageUploadProps
) => {
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

type DrawDetectionsProps = {
  detections: Detection[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  showMasks: boolean;
  imageDimensions: { width: number; height: number };
}

export const drawDetections = ({ 
  detections, 
  canvasRef, 
  imageRef, 
  showMasks, 
  imageDimensions 
}: DrawDetectionsProps) => {
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