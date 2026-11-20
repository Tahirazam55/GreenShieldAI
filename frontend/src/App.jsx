import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LiveViewDrawer from './components/LiveViewDrawer';
import ProgressModal from './components/ProgressModal';
import PatchHistoryModal from './components/Modals/PatchHistoryModal';
import LocationSelect from './components/Views/LocationSelect';
import HistoricalView from './components/Views/HistoricalView';
import SegmentationView from './components/Views/SegmentationView';
import PredictionView from './components/Views/PredictionView';
import VerificationView from './components/Views/VerificationView';
import AboutView from './components/Views/AboutView';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { activeTab, fetchInitialData } = useAppStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'location':
        return <LocationSelect />;
      case 'historical':
        return <HistoricalView />;
      case 'segmentation':
        return <SegmentationView />;
      case 'prediction':
        return <PredictionView />;
      case 'verification':
        return <VerificationView />;
      case 'about':
        return <AboutView />;
      default:
        return <LocationSelect />;
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark text-slate-100 flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#122A1C', color: '#fff', border: '1px solid #1F452E' } }} />
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-forest-dark to-[#07150D]">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      <LiveViewDrawer />
      <ProgressModal />
      <PatchHistoryModal />
    </div>
  );
}
