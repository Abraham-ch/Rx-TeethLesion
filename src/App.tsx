import './App.css'
import { Aside } from './components/Aside'
import { HomeSection } from './pages/Home'
import { DetectionSection } from './pages/DetectionSection'
import { ResultsSection } from './pages/ResultsSection'
import { SettingsSection } from './pages/Settings'
import { useState } from 'react'
import { CustomTitleBar } from './components/CustomTitleBar'

function App() {
  const [activeSection, setActiveSection] = useState('home');

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeSection />;
      case 'detection':
        return <DetectionSection />;
      case 'results':
        return <ResultsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <HomeSection />;
    }
  };

  return (
    <>
    <CustomTitleBar />
    <div className="min-h-dvh bg-gray-50/95 flex w-full pt-8 overflow-hidden">
      <Aside activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="p-8 flex-1 mx-auto overflow-auto">
        {renderSection()}
      </main>
    </div>
    </>
  );

}

export default App
