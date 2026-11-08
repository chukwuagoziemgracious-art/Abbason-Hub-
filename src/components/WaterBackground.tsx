import React, { useEffect, useRef } from 'react';

export const WaterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;
    let t = 0;
    let mx = 0.5;
    let my = 0.5;
    let targetMx = 0.5;
    let targetMy = 0.5;
    let rippleStrength = 1.0;

    const resize = () => {
      // 1/3 viewport resolution provides fluid 60fps performance on mobile and desktop
      w = canvas.width = Math.max(1, Math.floor(window.innerWidth / 3));
      h = canvas.height = Math.max(1, Math.floor(window.innerHeight / 3));
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();

    const updatePointer = (clientX: number, clientY: number, boost: boolean = false) => {
      targetMx = clientX / window.innerWidth;
      targetMy = clientY / window.innerHeight;
      if (boost) {
        rippleStrength = 2.2;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handlePointerDown = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY, true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sm = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };

    const frame = () => {
      // Smooth pointer interpolation
      mx += (targetMx - mx) * 0.12;
      my += (targetMy - my) * 0.12;
      if (rippleStrength > 1.0) {
        rippleStrength = Math.max(1.0, rippleStrength - 0.02);
      }

      t += prefersReducedMotion ? 0 : 0.01;
      const img = ctx.createImageData(w, h);
      const d = img.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ny = y / h;
          const dx = nx - mx;
          const dy = ny - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Radiant interactive ripple waves from pointer & touch
          const ripple = Math.sin(dist * 24 - t * 4) * Math.exp(-dist * 3.8) * rippleStrength;

          // Water surface height and natural ambient swells
          const v =
            Math.sin(nx * 8 + t * 1.4 + Math.sin(ny * 5 + t * 0.8)) * 0.5 +
            Math.sin(ny * 9 - t * 1.1 + Math.cos(nx * 6 - t * 0.7)) * 0.5 +
            Math.sin((nx + ny) * 11 + t * 0.9) * 0.25 +
            ripple * 1.1;

          // Radiant wave crest highlights (caustic reflection)
          const light = Math.pow(Math.max(0, v * 0.5 + 0.5), 2.6);

          // Nigerian Flag reflection: wave undulation stretches and wobbles the vertical bands
          const warp =
            Math.sin(ny * 8 + t * 1.2) * 0.028 +
            Math.sin(nx * 6 - t * 0.9 + ny * 3.5) * 0.02 +
            ripple * 0.04;
          const fx = nx + warp;

          // 3 vertical bands: Green (0..1/3) | White (1/3..2/3) | Green (2/3..1)
          const e1 = sm(0.333 - 0.045, 0.333 + 0.045, fx);
          const e2 = sm(0.667 - 0.045, 0.667 + 0.045, fx);
          const white = e1 * (1 - e2);
          const green = 1 - white;

          // Shading: wave modulation + radiant highlights + edge vignettes
          const waveShade = (0.55 + v * 0.38 + light * 0.8) * sm(0.0, 0.18, ny) * (1 - sm(0.85, 1.0, ny) * 0.45);
          const specular = light * 95;

          // Rich Nigerian Flag Emerald Green (#008751) calibration
          // Green channel: radiant emerald, modulated by water wave shading
          const greenR = 2 + specular * 0.12;
          const greenG = Math.min(255, 32 + 135 * waveShade * 0.85 + specular * 0.75);
          const greenB = Math.min(255, 20 + 81 * waveShade * 0.85 + specular * 0.45);

          // Center White Band calibration: luminous ivory/pearl white
          const whiteR = Math.min(255, 45 + 185 * waveShade * 0.8 + specular * 0.85);
          const whiteG = Math.min(255, 48 + 195 * waveShade * 0.8 + specular * 0.85);
          const whiteB = Math.min(255, 46 + 190 * waveShade * 0.8 + specular * 0.85);

          const i = (y * w + x) * 4;
          d[i] = Math.round(green * greenR + white * whiteR);
          d[i + 1] = Math.round(green * greenG + white * whiteG);
          d[i + 2] = Math.round(green * greenB + white * whiteB);
          d[i + 3] = 255;
        }
      }

      ctx.putImageData(img, 0, 0);
      animId = requestAnimationFrame(frame);
    };

    frame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <>
      <canvas
        id="water"
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        style={{ filter: 'blur(1.2px)' }}
        aria-hidden="true"
      />
      {/* Deep luxury vignette keeps central content readable while flag is clearly visible */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(2,4,6,0.3)_0%,rgba(2,4,6,0.85)_100%)]" 
        aria-hidden="true"
      />
    </>
  );
};
