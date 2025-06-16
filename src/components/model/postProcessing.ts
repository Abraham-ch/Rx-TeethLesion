// labels.ts - Definición de clases dentales
export const labels = [
  "Caries",
  "Periapical Lesion", 
  "Impacted Tooth"
];

export interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  class: number;
  className: string;
}

// Colores para cada clase (mismo orden que labels)
export const classColors = [
  '#ef4444', // Rojo para Caries
  '#f97316', // Naranja para Periapical Lesion  
  '#8b5cf6', // Púrpura para Impacted Tooth
];

/**
 * Aplica Non-Maximum Suppression (NMS) para eliminar cajas duplicadas
 */
function applyNMS(detections: Detection[], iouThreshold: number = 0.45): Detection[] {
  // Ordenar por confianza (mayor a menor)
  const sortedDetections = detections.sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];

  while (sortedDetections.length > 0) {
    const current = sortedDetections.shift()!;
    selected.push(current);

    // Remover detecciones que se superponen demasiado
    for (let i = sortedDetections.length - 1; i >= 0; i--) {
      const iou = calculateIoU(current.bbox, sortedDetections[i].bbox);
      if (iou > iouThreshold) {
        sortedDetections.splice(i, 1);
      }
    }
  }

  return selected;
}

/**
 * Calcula Intersection over Union (IoU) entre dos bounding boxes
 */
function calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
  const [x1_1, y1_1, w1, h1] = box1;
  const [x1_2, y1_2, w2, h2] = box2;
  
  const x2_1 = x1_1 + w1;
  const y2_1 = y1_1 + h1;
  const x2_2 = x1_2 + w2;
  const y2_2 = y1_2 + h2;

  // Área de intersección
  const intersectX1 = Math.max(x1_1, x1_2);
  const intersectY1 = Math.max(y1_1, y1_2);
  const intersectX2 = Math.min(x2_1, x2_2);
  const intersectY2 = Math.min(y2_1, y2_2);

  if (intersectX2 <= intersectX1 || intersectY2 <= intersectY1) {
    return 0; // No hay intersección
  }

  const intersectArea = (intersectX2 - intersectX1) * (intersectY2 - intersectY1);
  const box1Area = w1 * h1;
  const box2Area = w2 * h2;
  const unionArea = box1Area + box2Area - intersectArea;

  return unionArea > 0 ? intersectArea / unionArea : 0;
}

/**
 * Procesa los resultados del modelo YOLOv11
 * Formato esperado: [batch, 4 + num_classes, num_detections] = [1, 7, 8400]
 * Donde: [x_center, y_center, width, height, conf_class1, conf_class2, conf_class3]
 */
export function processYOLOResults(
  output: Float32Array,
  confidenceThreshold: number = 0.25,
  iouThreshold: number = 0.45,
  inputWidth: number = 640,
  inputHeight: number = 640
): Detection[] {
  console.log('🔧 Procesando resultados YOLO...');
  console.log('📊 Tamaño del output:', output.length);
  
  const numClasses = labels.length; // 3 clases
  const numDetections = 8400; // Típico para YOLOv11
  const outputWidth = 4 + numClasses; // 7 (4 coords + 3 clases)
  
  console.log(`📈 Configuración: ${numClasses} clases, ${numDetections} detecciones, ${outputWidth} valores por detección`);
  
  const detections: Detection[] = [];

  // Iterar sobre cada detección
  for (let i = 0; i < numDetections; i++) {
    const baseIndex = i * outputWidth;
    
    // Verificar que no nos salgamos del array
    if (baseIndex + outputWidth > output.length) {
      console.warn('⚠️ Índice fuera de rango, deteniendo procesamiento');
      break;
    }

    // Extraer coordenadas del bounding box (formato centro)
    const centerX = output[baseIndex];
    const centerY = output[baseIndex + 1];
    const width = output[baseIndex + 2];
    const height = output[baseIndex + 3];

    // Extraer confianzas de cada clase
    const classConfidences = [];
    for (let j = 0; j < numClasses; j++) {
      classConfidences.push(output[baseIndex + 4 + j]);
    }

    // Encontrar la clase con mayor confianza
    const maxConfidence = Math.max(...classConfidences);
    const classId = classConfidences.indexOf(maxConfidence);

    // Filtrar por umbral de confianza
    if (maxConfidence < confidenceThreshold) {
      continue;
    }

    // Convertir de formato centro a esquina superior izquierda
    const x = centerX - width / 2;
    const y = centerY - height / 2;

    // Validar que las coordenadas estén dentro de los límites
    if (x < 0 || y < 0 || x + width > inputWidth || y + height > inputHeight) {
      continue;
    }

    // Validar que el tamaño sea razonable
    if (width <= 0 || height <= 0 || width > inputWidth || height > inputHeight) {
      continue;
    }

    detections.push({
      bbox: [x, y, width, height],
      confidence: maxConfidence,
      class: classId,
      className: labels[classId] || `Clase ${classId}`
    });
  }

  console.log(`✅ Detecciones antes de NMS: ${detections.length}`);

  // Aplicar Non-Maximum Suppression
  const finalDetections = applyNMS(detections, iouThreshold);
  
  console.log(`🎯 Detecciones finales después de NMS: ${finalDetections.length}`);
  
  return finalDetections;
}

/**
 * Escala las bounding boxes de las dimensiones del modelo a las dimensiones originales de la imagen
 */
export function scaleBoundingBoxes(
  detections: Detection[],
  originalWidth: number,
  originalHeight: number,
  modelWidth: number = 640,
  modelHeight: number = 640
): Detection[] {
  const scaleX = originalWidth / modelWidth;
  const scaleY = originalHeight / modelHeight;

  return detections.map(detection => ({
    ...detection,
    bbox: [
      detection.bbox[0] * scaleX,
      detection.bbox[1] * scaleY,
      detection.bbox[2] * scaleX,
      detection.bbox[3] * scaleY
    ] as [number, number, number, number]
  }));
}

/**
 * Función de debug para analizar la salida del modelo
 */
export function debugModelOutput(output: Float32Array, sampleSize: number = 50): void {
  console.log('🔍 DEBUG: Analizando salida del modelo...');
  console.log('📏 Tamaño total del output:', output.length);
  
  // Mostrar una muestra de los valores
  console.log('📊 Primeros valores:', Array.from(output.slice(0, sampleSize)));
  
  // Analizar distribución de valores
  const nonZeroValues = Array.from(output).filter(v => Math.abs(v) > 0.001);
  console.log('📈 Valores no-cero:', nonZeroValues.length);
  console.log('📊 Rango de valores:', {
    min: Math.min(...Array.from(output)),
    max: Math.max(...Array.from(output)),
    mean: Array.from(output).reduce((a, b) => a + b, 0) / output.length
  });
  
  // Verificar si es el formato esperado para YOLOv11
  const expectedLength = 8400 * 7; // 8400 detecciones × 7 valores cada una
  if (output.length === expectedLength) {
    console.log('✅ Formato compatible con YOLOv11 (8400 × 7)');
  } else {
    console.log(`⚠️ Formato inesperado. Esperado: ${expectedLength}, Actual: ${output.length}`);
    
    // Intentar detectar el formato
    const possibleFormats = [
      { detections: 8400, values: 7, name: 'YOLOv11 standard' },
      { detections: 8400, values: 8, name: 'YOLOv11 with objectness' },
      { detections: 25200, values: 7, name: 'YOLOv8 format' },
      { detections: 25200, values: 8, name: 'YOLOv8 with objectness' },
    ];
    
    for (const format of possibleFormats) {
      if (output.length === format.detections * format.values) {
        console.log(`🎯 Posible formato: ${format.name} (${format.detections} × ${format.values})`);
      }
    }
  }
}