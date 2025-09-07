import { Upload, Brain, Download } from 'lucide-react';
import { MainCard } from '../components/ui/MainCard';
import { NavigationFunction } from '../types/navigate';

type Props = {
  onNavigate?: NavigationFunction;
}

export const HomeSection = ( props : Props ) => {
  const { onNavigate } = props;
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Detección de Objetos con YOLOv11</h2>
        <p className="text-lg text-gray-600">Carga una imagen y detecta objetos usando tu modelo entrenado</p>
      </div>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MainCard 
          title="Carga tu Imagen" 
          meta="Sube imágenes en formato JPG, PNG o WEBP" 
          className='bg-blue-100'
          svg={<Upload className="w-6 h-6 text-blue-600" />} 
          onClick={() => onNavigate && onNavigate('detection')}
        />
        <MainCard 
          title="Detección IA" 
          meta="Segmentación con YOLOv11 en tiempo real" 
          className='bg-green-100'
          svg={<Brain className="w-6 h-6 text-green-600" />}
          onClick={() => onNavigate && onNavigate('settings')}
        />
        <MainCard 
          title="Exporta Resultados" 
          meta="Descarga imágenes con segmentación aplicada" 
          className='bg-purple-100'
          svg={<Download className="w-6 h-6 text-purple-600" />}
          onClick={() => onNavigate && onNavigate('results')}
        />
      </section>
      
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Estadísticas de Uso</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-600">Imágenes Procesadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-600">Precisión Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">1.2s</div>
            <div className="text-sm text-gray-600">Tiempo Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <div className="text-sm text-gray-600">Clases Detectadas</div>
          </div>
        </div>
      </section>
    </div>
  );
};
