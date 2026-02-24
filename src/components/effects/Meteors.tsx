'use client';

import { useMemo, useState, useEffect } from 'react';

export default function Meteors({ number = 20 }: { number?: number }) {
    const [isMounted, setIsMounted] = useState(false);
    const [width, setWidth] = useState(1920);

    useEffect(() => {
        setIsMounted(true);
        setWidth(window.innerWidth);
    }, []);

    const meteorStyles = useMemo(() => {
        if (!isMounted) return [];
        return [...new Array(number)].map(() => ({
            // eslint-disable-next-line react-hooks/purity
            top: -5,
            // eslint-disable-next-line react-hooks/purity
            left: Math.floor(Math.random() * width) + "px",
            // eslint-disable-next-line react-hooks/purity
            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
            // eslint-disable-next-line react-hooks/purity
            animationDuration: Math.random() * (10 - 2) + 2 + "s",
        }));
    }, [number, width, isMounted]);

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
            {meteorStyles.map((style, idx) => (
                <span
                    key={"meteor" + idx}
                    style={style}
                    className="absolute top-1/2 left-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                >
                    <div className="pointer-events-none absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-r from-slate-500 to-transparent" />
                </span>
            ))}
        </div>
    );
}
