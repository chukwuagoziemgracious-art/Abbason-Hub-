import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  color: string;
}

interface MiniFlag {
  x: number;
  y: number;
  z: number; // 0.3 (far) to 1.1 (close)
  baseW: number;
  baseH: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  wavePhase: number;
  waveSpeed: number;
  waveAmp: number;
  floatOffset: number;
  floatSpeed: number;
}

export const WaterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer influence
    let mouseX = -9999;
    let mouseY = -9999;
    let targetMouseX = -9999;
    let targetMouseY = -9999;

    const FLAG_COUNT = window.innerWidth < 640 ? 28 : 48;
    const STAR_COUNT = window.innerWidth < 640 ? 60 : 120;

    let stars: Star[] = [];
    let flags: MiniFlag[] = [];

    const initEntities = () => {
      // Starfield in black space
      stars = Array.from({ length: STAR_COUNT }, () => {
        const baseAlpha = Math.random() * 0.6 + 0.2;
        const colorPalette = ['#FFFFFF', '#E9E6DF', '#C8A96A', '#6EE7B7', '#A7F3D0'];
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: colorPalette[Math.floor(Math.random() * colorPalette.length)]
        };
      });

      // Small Nigeria flags drifting through black space
      flags = Array.from({ length: FLAG_COUNT }, () => {
        const z = Math.random() * 0.75 + 0.35; // Depth factor
        const baseW = (Math.random() * 14 + 22) * z; // 10px to 38px width
        const baseH = baseW * 0.58; // Standard ~1:1.72 flag aspect ratio
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          baseW,
          baseH,
          vx: (Math.random() * 0.35 + 0.15) * (Math.random() > 0.45 ? 1 : -1) * (0.5 + z * 0.6),
          vy: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1) * (0.5 + z * 0.6),
          rot: (Math.random() - 0.5) * 0.6,
          vRot: (Math.random() - 0.5) * 0.004,
          wavePhase: Math.random() * Math.PI * 2,
          waveSpeed: Math.random() * 0.04 + 0.025,
          waveAmp: Math.random() * 2.2 + 1.2,
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: Math.random() * 0.02 + 0.01
        };
      });
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      initEntities();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    const handlePointerMove = (e: PointerEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handlePointerLeave = () => {
      targetMouseX = -9999;
      targetMouseY = -9999;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let time = 0;

    // Draw single animated small Nigeria flag (Green - White - Green)
    const drawMiniFlag = (f: MiniFlag) => {
      const w = f.baseW;
      const h = f.baseH;
      const stripeW = w / 3;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);

      // Deep space atmospheric fade by depth
      const alpha = Math.min(0.95, Math.max(0.25, f.z * 0.85));
      ctx.globalAlpha = alpha;

      // Soft ambient glow around flag in dark space
      ctx.shadowColor = 'rgba(0, 135, 81, 0.45)';
      ctx.shadowBlur = Math.round(6 * f.z);

      const segments = 10;
      const segW = w / segments;

      // Wave calculation function
      const getWaveY = (segX: number) => {
        return Math.sin(f.wavePhase + (segX / w) * Math.PI * 2) * f.waveAmp;
      };

      // Draw the three Nigerian vertical stripes with fluttering wave distortion
      // 1. Left Stripe: Emerald Green (#008751)
      // 2. Middle Stripe: Pure White (#FFFFFF)
      // 3. Right Stripe: Emerald Green (#008751)
      const colors = ['#008751', '#FFFFFF', '#008751'];

      for (let s = 0; s < 3; s++) {
        const stripeStartX = -w / 2 + s * stripeW;
        ctx.fillStyle = colors[s];
        ctx.beginPath();

        // Top edge with wave
        const startTopY = -h / 2 + getWaveY(stripeStartX + w / 2);
        ctx.moveTo(stripeStartX, startTopY);

        const endTopY = -h / 2 + getWaveY(stripeStartX + stripeW + w / 2);
        ctx.lineTo(stripeStartX + stripeW, endTopY);

        // Right edge down
        const endBotY = h / 2 + getWaveY(stripeStartX + stripeW + w / 2);
        ctx.lineTo(stripeStartX + stripeW, endBotY);

        // Bottom edge with wave back
        const startBotY = h / 2 + getWaveY(stripeStartX + w / 2);
        ctx.lineTo(stripeStartX, startBotY);

        ctx.closePath();
        ctx.fill();
      }

      // Subtle fabric wave shadow & highlight for 3D fluttering flag realism
      ctx.shadowBlur = 0;
      const crestGradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      const waveShift = (Math.sin(f.wavePhase) + 1) / 2;
      crestGradient.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
      crestGradient.addColorStop(Math.max(0.1, Math.min(0.9, waveShift)), 'rgba(255, 255, 255, 0.16)');
      crestGradient.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
      ctx.fillStyle = crestGradient;
      ctx.fillRect(-w / 2, -h / 2 - f.waveAmp, w, h + f.waveAmp * 2);

      // Fine golden pole string / edge highlight on left
      ctx.strokeStyle = 'rgba(200, 169, 106, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + getWaveY(0));
      ctx.lineTo(-w / 2, h / 2 + getWaveY(0));
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      time += 0.016;

      // Pointer easing
      if (targetMouseX > -1000) {
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
      } else {
        mouseX = -9999;
        mouseY = -9999;
      }

      // 1. Deep black space background
      ctx.fillStyle = '#020406';
      ctx.fillRect(0, 0, width, height);

      // Subtle space radial illumination in center
      const radial = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.05,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      radial.addColorStop(0, 'rgba(5, 12, 8, 0.4)');
      radial.addColorStop(0.6, 'rgba(2, 4, 6, 0.7)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // 2. Render twinkling stars in deep space
      stars.forEach((star) => {
        star.alpha = star.baseAlpha + Math.sin(time * 3 + star.x) * (star.baseAlpha * 0.4);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Update and render moving small Nigeria flags
      const margin = 80;

      flags.forEach((f) => {
        if (!prefersReducedMotion) {
          // Floating motion & wave
          f.x += f.vx;
          f.y += f.vy + Math.sin(time * 2 + f.floatOffset) * 0.25;
          f.rot += f.vRot;
          f.wavePhase += f.waveSpeed;

          // Gentle mouse avoidance/interaction
          if (mouseX > -1000) {
            const dx = f.x - mouseX;
            const dy = f.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140 && dist > 1) {
              const pushForce = ((140 - dist) / 140) * 0.8;
              f.x += (dx / dist) * pushForce;
              f.y += (dy / dist) * pushForce;
            }
          }

          // Screen wrapping across space
          if (f.x < -margin) f.x = width + margin;
          else if (f.x > width + margin) f.x = -margin;

          if (f.y < -margin) f.y = height + margin;
          else if (f.y > height + margin) f.y = -margin;
        }

        drawMiniFlag(f);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <>
      <canvas
        id="nigeria-space-bg"
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle deep vignette overlay to maintain premium typographic clarity across the hub */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0)_0%,rgba(2,4,6,0.65)_70%,rgba(0,0,0,0.92)_100%)]" 
        aria-hidden="true"
      />
    </>
  );
};
