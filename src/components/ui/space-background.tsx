"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleOffset: number;
  twinkleRate: number;
  colorShift: number;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const LAYERS = [
      { count: 260, sizeMin: 0.4, sizeMax: 0.9, speedY: 0.06, baseOpacity: 0.35 },
      { count: 120, sizeMin: 0.9, sizeMax: 1.6, speedY: 0.14, baseOpacity: 0.55 },
      { count: 45,  sizeMin: 1.8, sizeMax: 3.0, speedY: 0.28, baseOpacity: 0.85 },
    ];

    const stars: Star[] = LAYERS.flatMap((l) =>
      Array.from({ length: l.count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: l.sizeMin + Math.random() * (l.sizeMax - l.sizeMin),
        speed: l.speedY * (0.8 + Math.random() * 0.4),
        opacity: l.baseOpacity * (0.6 + Math.random() * 0.4),
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleRate: 0.3 + Math.random() * 0.8,
        colorShift: Math.random(),
      }))
    );

    const NEBULAE = Array.from({ length: 5 }, () => ({
      x: Math.random(),
      y: Math.random(),
      rx: 0.12 + Math.random() * 0.18,
      ry: 0.08 + Math.random() * 0.14,
      hue: [240, 270, 200, 300, 220][Math.floor(Math.random() * 5)],
      alpha: 0.025 + Math.random() * 0.03,
    }));

    const handleScroll = (e: Event) => {
      scrollRef.current = (e.target as HTMLElement).scrollTop;
    };

    const scrollEl = document.querySelector("[data-scroll-container]");
    scrollEl?.addEventListener("scroll", handleScroll, { passive: true });

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const n of NEBULAE) {
        const cx = n.x * W;
        const cy = n.y * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.rx * W);
        grad.addColorStop(0, `hsla(${n.hue},70%,55%,${n.alpha})`);
        grad.addColorStop(1, `hsla(${n.hue},70%,55%,0)`);
        ctx.save();
        ctx.scale(1, n.ry / n.rx);
        ctx.beginPath();
        ctx.arc(cx, cy * (n.rx / n.ry), n.rx * W, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      for (const s of stars) {
        const drift = (time * s.speed * 60) % H;
        const parallax = scrollRef.current * s.speed * 0.6;
        let y = (s.y - drift - parallax % H + H * 2) % H;

        const twinkle = Math.sin(time * s.twinkleRate + s.twinkleOffset);
        const opacity = Math.max(0.05, s.opacity * (0.75 + 0.25 * twinkle));

        let r = 255, g = 255, b = 255;
        if (s.colorShift < 0.15) { r = 190; g = 210; b = 255; }
        else if (s.colorShift > 0.85) { r = 255; g = 240; b = 200; }

        ctx.beginPath();
        ctx.arc(s.x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.fill();

        if (s.size > 1.8) {
          const glowR = s.size * 3.5;
          const glow = ctx.createRadialGradient(s.x, y, 0, s.x, y, glowR);
          glow.addColorStop(0, `rgba(${r},${g},${b},${opacity * 0.35})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(s.x, y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          if (s.size > 2.4 && opacity > 0.6) {
            const fLen = s.size * 6;
            ctx.save();
            ctx.globalAlpha = opacity * 0.2;
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(s.x - fLen, y);
            ctx.lineTo(s.x + fLen, y);
            ctx.moveTo(s.x, y - fLen);
            ctx.lineTo(s.x, y + fLen);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      time += 0.012;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      scrollEl?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
