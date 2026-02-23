'use client';

import { useEffect, useRef } from 'react';

export default function CosmicParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 10000);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5,
                    speed: Math.random() * 0.2 + 0.05,
                    opacity: Math.random() * 0.5 + 0.1,
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (0.5 + Math.sin(Date.now() * 0.001 * p.speed) * 0.5)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                p.y -= p.speed;
                if (p.y < 0) p.y = canvas.height;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ filter: 'blur(0.5px)' }}
        />
    );
}
