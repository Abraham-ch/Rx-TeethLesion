export const SettingsSection = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h2>
        <p className="text-gray-600">Ajusta los parámetros del modelo y la aplicación</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Configuración del Modelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo del Modelo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="yolov11-seg.onnx"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Cambiar
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato del Modelo
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="onnx">ONNX (.onnx)</option>
                <option value="pytorch">PyTorch (.pt)</option>
                <option value="tensorflow">TensorFlow.js (.fljs)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confianza por Defecto
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de Entrada
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="640">640x640</option>
                <option value="1280">1280x1280</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Clases Detectables</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Persona', 'Bicicleta', 'Automóvil', 'Motocicleta',
              'Avión', 'Autobús', 'Tren', 'Camión',
              'Barco', 'Semáforo', 'Señal de Stop', 'Parquímetro'
            ].map((className, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`class-${index}`}
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`class-${index}`} className="text-sm text-gray-700">
                  {className}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Configuración General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Guardar Resultados Automáticamente</label>
                <p className="text-xs text-gray-500">Los resultados se guardarán automáticamente después de la detección</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Mostrar Confianza en Etiquetas</label>
                <p className="text-xs text-gray-500">Muestra el porcentaje de confianza junto a cada detección</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Tema Oscuro</label>
                <p className="text-xs text-gray-500">Cambia la interfaz a modo oscuro</p>
              </div>
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Restablecer
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
