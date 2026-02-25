'use client';

import SkyCanvas from '@/components/sky-map/SkyCanvas';
import Header from '@/components/panels/Header';
import SidePanel from '@/components/panels/SidePanel';
import CosmicParticles from '@/components/effects/CosmicParticles';
import Meteors from '@/components/effects/Meteors';
import AIAstronoma from '@/components/panels/AIAstronoma';
import TimeTravelControls from '@/components/panels/TimeTravelControls';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const setTime = useAppStore((state) => state.setTime);
  const isLive = useAppStore((state) => state.isLive);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const nightMode = useAppStore((state) => state.settings.nightMode);
  useGeolocation();

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, setTime]);

  return (
    <main className={`flex flex-col h-screen w-screen overflow-hidden bg-black font-sans selection:bg-blue-500/30 transition-all duration-700 ${nightMode ? 'night-mode-active' : ''}`}>
      <CosmicParticles />
      <Meteors number={15} />

      <div className="z-10 flex flex-col h-full w-full">
        <Header />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Canvas — always fills available space */}
          <div className="flex-1 relative min-w-0">
            <SkyCanvas />
            <TimeTravelControls />
            <AIAstronoma />
          </div>

          {/* Mobile backdrop — closes sidebar on tap outside */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <SidePanel />

          {/* Mobile FAB — open sidebar button when closed on mobile */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Abrir gu\u00eda"
              className="fixed bottom-24 right-4 z-50 md:hidden w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-blue-500/40 bg-blue-600/70 backdrop-blur-sm text-white hover:bg-blue-500/80 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>
    </main>
  );
}
