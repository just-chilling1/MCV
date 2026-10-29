"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/config/brand.config";

/** Brand gold — single-color glow palette */
const GOLD = brand.colors.primary;
const GOLD_RGB = "238, 179, 16";

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

function parseGoldRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return GOLD_RGB;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rgb = parseGoldRgb(GOLD);

    let particles: Particle[] = [];
    let animationFrameId = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const area = window.innerWidth * window.innerHeight;
      const particleCount = Math.min(90, Math.floor(area / 14000));

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          dx: (Math.random() - 0.5) * 0.35,
          dy: (Math.random() - 0.5) * 0.35,
          size: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.35 + 0.15,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: reducedMotion ? 0 : 0.012 + Math.random() * 0.018,
        });
      }
    };

    const drawParticle = (p: Particle) => {
      const glowAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.pulse));
      const glowRadius = p.size * 8;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      gradient.addColorStop(0, `rgba(${rgb}, ${glowAlpha * 0.55})`);
      gradient.addColorStop(0.35, `rgba(${rgb}, ${glowAlpha * 0.2})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${Math.min(glowAlpha + 0.25, 0.75)})`;
      ctx.fill();
    };

    const tick = (p: Particle) => {
      if (reducedMotion) return;
      p.x += p.dx;
      p.y += p.dy;
      p.pulse += p.pulseSpeed;

      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = canvas.height + 20;
      if (p.y > canvas.height + 20) p.y = -20;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        tick(p);
        drawParticle(p);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
