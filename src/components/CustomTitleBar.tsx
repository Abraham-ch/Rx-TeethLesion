import { Zap, Minus, Square, X } from 'lucide-react';
import { CSSProperties } from 'react';
const { ipcRenderer } = window.require('electron');

export const CustomTitleBar = () => {
  const handleMinimize = async () => {
    await ipcRenderer.invoke('minimize-window');
  };
  
  const handleMaximize = async () => {
    await ipcRenderer.invoke('maximize-window');
  };
  
  const handleClose = async () => {
    await ipcRenderer.invoke('close-window');
  };
  
  

  return (
    <div className="absolute w-full text-gray-500 border-b border-gray-200 h-8 flex items-center justify-between px-4 select-none" style={{ WebkitAppRegion: 'drag' } as CSSProperties}>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium">Electro Vite - YOLOv11 Segmentation</span>
      </div>
      
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-300 rounded transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-300 rounded transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-500 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
