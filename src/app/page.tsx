'use client';

import SkyCanvas from '@/components/sky-map/SkyCanvas';
import Header from '@/components/panels/Header';
import SidePanel from '@/components/panels/SidePanel';
import AIAstronoma from '@/components/panels/AIAstronoma';
import TimeTravelControls from '@/components/panels/TimeTravelControls';
import ViewModeWidget from '@/components/panels/ViewModeWidget';
import SnapshotButton from '@/components/panels/SnapshotButton';
import DiagnosticsOverlay from '@/components/panels/DiagnosticsOverlay';
import SystemAlerts from '@/components/panels/SystemAlerts';
import Onboarding from '@/components/Onboarding';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { BookOpen } from 'lucide-react';
import BootSequence from '@/components/ui/BootSequence';

/** Detecta el tier de rendimiento del dispositivo de forma síncrona */
function detectQualityTier(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'high';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores  = navigator.hardwareConcurrency ?? 4;
  const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 900;
  if ((memory !== undefined && memory < 2) || (isMobile && cores <= 4)) return 'low';
  if (isMobile || cores <= 4) return 'medium';
  return 'high';
}

export default function Home() {
  const isLive = useAppStore((state) => state.isLive);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const nightMode = useAppStore((state) => state.settings.nightMode);
  const setDeviceQuality = useAppStore((state) => state.setDeviceQuality);
  const { requestLocation } = useGeolocation();

  // Detectar tier de GPU/CPU una sola vez al montar
  useEffect(() => {
    setDeviceQuality(detectQualityTier());
  }, [setDeviceQuality]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      useAppStore.getState().setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  return (
    <main className={`flex flex-col h-screen w-screen overflow-hidden bg-black font-sans selection:bg-blue-500/30 transition-all duration-700 ${nightMode ? 'night-mode-active' : ''}`}>

      {/* Observatorio UI Layer - Respetando Safe Area */}
      <div className="z-10 flex flex-col h-full w-full pointer-events-none">
        
        {/* Header con padding superior para Notch */}
        <div className="pointer-events-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <Header onRequestLocation={requestLocation} />
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Canvas - Ocupa TODO el espacio de fondo (edge-to-edge) */}
          <div className="absolute inset-0 z-0 pointer-events-auto">
            <SkyCanvas />
          </div>

          {/* Floating UI Elements */}
          <div className="flex-1 relative min-w-0 pointer-events-none">
            <TimeTravelControls />
            <ViewModeWidget />
            <SnapshotButton />
          </div>

          {/* Sidebar/BottomSheet Layer */}
          <div className="pointer-events-auto">
            <SidePanel />
          </div>

          <DiagnosticsOverlay />
          <SystemAlerts />

          {/* Mobile FAB — opens the Bottom Sheet when it's closed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Abrir guía"
              className="pointer-events-auto fixed bottom-6 right-4 z-[70] md:hidden w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-blue-500/40 bg-blue-600/70 backdrop-blur-sm text-white hover:bg-blue-500/80 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Guía Vocal IA */}
      <AIAstronoma />

      {/* Onboarding — shown only on first visit */}
      <Onboarding />

      {/* Visual background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Cinematic Boot Sequence (Runs once per session) */}
      <BootSequence />
    </main>
  );
}
