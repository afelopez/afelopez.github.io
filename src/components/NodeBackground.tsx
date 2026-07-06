'use client';
import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 70;
const CONNECT_DIST = 150;
const MOUSE_RADIUS = 130;
const BASE_SPEED = 0.28;

// Gradient palettes — random on mount
const PALETTES: Array<[number[], number[]]> = [
  [[249, 115, 22],  [168, 85, 247]],   // orange → purple
  [[6, 182, 212],   [99, 102, 241]],   // cyan → indigo
  [[16, 185, 129],  [132, 204, 22]],   // emerald → lime
  [[236, 72, 153],  [139, 92, 246]],   // pink → violet
  [[20, 184, 166],  [59, 130, 246]],   // teal → blue
];

function lerp3(a: number[], b: number[], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export default function NodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [c1, c2] = PALETTES[Math.floor(Math.random() * PALETTES.length)];
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
      const dark = document.documentElement.classList.contains('dark');

      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS && d > 0) {
          const force = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * 0.32;
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
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > w) { n.x = w; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > h) { n.y = h; n.vy *= -1; }
      }

      // Color each node by diagonal position — creates gradient across canvas
      const nodeColors = nodes.map(n =>
        lerp3(c1, c2, (n.x / w) * 0.55 + (n.y / h) * 0.45)
      );

      const lineAlpha = dark ? 0.24 : 0.16;
      const nodeAlpha = dark ? 0.65 : 0.50;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const a = (1 - d / CONNECT_DIST) * lineAlpha;
            const [r1, g1, b1] = nodeColors[i];
            const [r2, g2, b2] = nodeColors[j];
            const grad = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y
            );
            grad.addColorStop(0, `rgba(${r1},${g1},${b1},${a})`);
            grad.addColorStop(1, `rgba(${r2},${g2},${b2},${a})`);
            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const [r, g, b] = nodeColors[i];
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${nodeAlpha})`;
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
