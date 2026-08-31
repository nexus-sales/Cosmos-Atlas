'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Camera as CameraIcon } from 'lucide-react';
import SkyCanvas from '@/components/sky-map/SkyCanvas';
import Header from '@/components/panels/Header';
import SidePanel from '@/components/panels/SidePanel';
import AIAstronoma from '@/components/panels/AIAstronoma';
import TimeTravelControls from '@/components/panels/TimeTravelControls';
import ViewModeWidget from '@/components/panels/ViewModeWidget';
import SnapshotButton from '@/components/panels/SnapshotButton';
import DiagnosticsOverlay from '@/components/panels/DiagnosticsOverlay';
import SystemAlerts from '@/components/panels/SystemAlerts';
import MobileObjectSheet from '@/components/panels/MobileObjectSheet';
import Onboarding from '@/components/Onboarding';
import { useAppStore } from '@/stores/useAppStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import BootSequence from '@/components/ui/BootSequence';
import { cn } from '@/lib/utils';

function detectQualityTier(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'high';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 900;
  if ((memory !== undefined && memory < 2) || (isMobile && cores <= 4)) return 'low';
  if (isMobile || cores <= 4) return 'medium';
  return 'high';
}

/**
 * Barra de herramientas móvil (md:hidden).
 * Chip inferior-izquierdo que abre un tray con viaje temporal y captura.
 * El toggle AR (ViewModeWidget) vive en el lado derecho — este es su simétrico.
 */
function MobileToolbar() {
  const [open, setOpen] = useState(false);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  if (sidebarOpen) return null;

  const takeSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmos-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Collapsed chip — bottom-left, symmetric to ViewModeWidget chip on the right */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Herramientas"
        aria-expanded={open ? 'true' : 'false'}
        className={cn(
          'fixed bottom-20 left-4 z-[80] flex items-center gap-2 px-3 py-2 rounded-full border glass-blur-heavy shadow-xl transition-all active:scale-95 pointer-events-auto',
          open
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
            : 'bg-black/60 border-white/10 text-white/50'
        )}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold tracking-widest uppercase">Tiempo</span>
      </button>

      {/* Slide-up tray */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-tray"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[85] bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]"
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
              <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">
                Herramientas
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar herramientas"
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded time travel controls */}
            <div className="px-4 pt-3 pb-2">
              <TimeTravelControls embedded />
            </div>

            {/* Snapshot */}
            <div className="px-4 pb-5">
              <button
                type="button"
                onClick={takeSnapshot}
                className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-white/10 transition-colors active:scale-[0.98]"
              >
                <CameraIcon className="w-4 h-4" />
                Capturar Polaroid
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const isLive = useAppStore((state) => state.isLive);
  const nightMode = useAppStore((state) => state.settings.nightMode);
  const setDeviceQuality = useAppStore((state) => state.setDeviceQuality);
  const { requestLocation } = useGeolocation();

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
      <div className="z-10 flex flex-col h-full w-full pointer-events-none">
        <div className="pointer-events-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <Header onRequestLocation={requestLocation} />
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className="absolute inset-0 z-0 pointer-events-auto">
            <SkyCanvas />
          </div>

          <div className="flex-1 relative min-w-0 pointer-events-none">
            {/* Desktop only: floating time controls + snapshot */}
            <div className="hidden md:block">
              <TimeTravelControls />
              <SnapshotButton />
            </div>

            {/* All screens: AR mode toggle — uses fixed positioning internally */}
            <ViewModeWidget />
          </div>

          <div className="pointer-events-auto">
            <SidePanel />
          </div>

          <DiagnosticsOverlay />
          <SystemAlerts />
        </div>
      </div>

      {/* Mobile-only tools tray (time travel + snapshot) */}
      <MobileToolbar />
      <MobileObjectSheet />

      <AIAstronoma />
      <Onboarding />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      <BootSequence />
    </main>
  );
}
