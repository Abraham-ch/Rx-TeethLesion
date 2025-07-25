import { Home, Brain, Activity, Settings, Zap } from 'lucide-react';

interface AsideProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Aside = ({ activeSection, setActiveSection }: AsideProps) => {
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'detection', label: 'Detección', icon: Brain },
    { id: 'results', label: 'Resultados', icon: Activity },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="border-r border-gray-200 flex flex-col min-w-xs">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RX Teeth Lession <br /> Detection</h1>
            <p className="text-sm text-gray-500">YOLOv11 Segmentation</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Modelo Cargado</span>
          </div>
          <p className="text-xs text-gray-500">YOLOv11-seg.onnx</p>
        </div>
      </div>
    </aside>
  );
};
