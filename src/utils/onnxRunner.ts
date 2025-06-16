import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

export async function runONNX(imageData: Float32Array) {
  if (!session) {
    session = await ort.InferenceSession.create('/model/best.onnx');
    console.log('Modelo ONNX cargado');
  }

  const inputTensor = new ort.Tensor('float32', imageData, [1, 3, 640, 640]); // BCHW
  const feeds = { [session.inputNames[0]]: inputTensor };

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]];
  return output.data;
}