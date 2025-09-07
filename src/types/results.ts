export const labels = [
  "Caries",
  "Periapical Lesion", 
  "Impacted Tooth"
];

export const classColors = [
  '#FF3838', // Rojo para Caries
  '#FF9D97', // Rosa para Periapical Lesion  
  '#FF701F', // Naranja para Impacted Tooth
];

export type Detection = {
  className: string;
  class: number;
  confidence: number;
  bbox: [number, number, number, number];
  color: string;
}

export type ProcessResultsProps = {
  output: Float32Array,
  modelWidth: number,
  modelHeight: number,
  imageWidth: number,
  imageHeight: number,
}