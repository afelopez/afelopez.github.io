'use client';
import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 75;
const CONNECT_DIST = 140;
const MOUSE_RADIUS = 130;
const BASE_SPEED = 0.25;

const THEME_COLORS: Record<string, { node: string; line: string }> = {
  sunset:   { node: '249,115,22',  line: '249,115,22'  },
  ocean:    { node: '59,130,246',  line: '59,130,246'  },
  forest:   { node: '16,185,129',  line: '16,185,129'  },
  midnight: { node: '124,58,237',  line: '124,58,237'  },
  mono:     { node: '107,114,128', line: '107,114,128' },
};

function getTheme(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'sunset';
}

function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function NodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * BASE_SPEED,
      vy: (Math.random() - 0.5) * BASE_SPEED,
    }));

    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const draw = () => {
      const { width: w, height: h } = canvas;
      const dark = isDarkMode();
      const theme = getTheme();
      const colors = THEME_COLORS[theme] ?? THEME_COLORS.sunset;

      ctx.clearRect(0, 0, w, h);

      // Update positions
      for (const n of nodes) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < MOUSE_RADIUS && d > 0) {
          const force = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * 0.35;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }

        n.vx *= 0.97;
        n.vy *= 0.97;

        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > BASE_SPEED * 3) {
          n.vx = (n.vx / spd) * BASE_SPEED * 3;
          n.vy = (n.vy / spd) * BASE_SPEED * 3;
        }

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > w) { n.x = w; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > h) { n.y = h; n.vy *= -1; }
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const a = (1 - d / CONNECT_DIST) * (dark ? 0.18 : 0.12);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${colors.line},${a})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      const nodeAlpha = dark ? 0.45 : 0.35;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.node},${nodeAlpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'var(--background)' }}
    />
  );
}
