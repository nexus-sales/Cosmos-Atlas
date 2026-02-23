'use client';

import SkyCanvas from '@/components/sky-map/SkyCanvas';
import Header from '@/components/panels/Header';
import SidePanel from '@/components/panels/SidePanel';
import CosmicParticles from '@/components/effects/CosmicParticles';
import Meteors from '@/components/effects/Meteors';
import TimeTravelControls from '@/components/panels/TimeTravelControls';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

import { useGeolocation } from '@/hooks/useGeolocation';

export default function Home() {
  const setTime = useAppStore((state) => state.setTime);
  const isLive = useAppStore((state) => state.isLive);
  useGeolocation();

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, setTime]);

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-black font-sans selection:bg-blue-500/30">
      <CosmicParticles />
      <Meteors number={15} />

      <div className="z-10 flex flex-col h-full w-full">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <SkyCanvas />
            <TimeTravelControls />
          </div>

          <SidePanel />
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
