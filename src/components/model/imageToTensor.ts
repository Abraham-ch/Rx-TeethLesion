import * as ort from 'onnxruntime-web';

export const imageToTensor = async (imageSrc: string): Promise<ort.Tensor> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No se pudo obtener el contexto del canvas');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      // Convertir a formato [1, 3, height, width]
      const input = new Float32Array(3 * width * height);
      for (let i = 0; i < width * height; i++) {
        input[i] = data[i * 4] / 255.0; // R
        input[i + width * height] = data[i * 4 + 1] / 255.0; // G
        input[i + 2 * width * height] = data[i * 4 + 2] / 255.0; // B
      }

      resolve(new ort.Tensor('float32', input, [1, 3, height, width]));
    };

    img.onerror = (e) => reject(e);
  });
};
