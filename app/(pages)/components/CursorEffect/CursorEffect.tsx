"use client";
import { useEffect, useRef } from "react";

const CursorEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const trail: { x: number; y: number }[] = [];
    const maxTrail = 30;
    let mouseX = 0,
      mouseY = 0;

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMove);

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trail.push({ x: mouseX, y: mouseY });
      if (trail.length > maxTrail) trail.shift();

      ctx.beginPath();
      for (let i = 0; i < trail.length - 1; i++) {
        const p = trail[i];
        const next = trail[i + 1];
        const alpha = i / trail.length;
        ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
        ctx.lineWidth = 4 * (1 - alpha);
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
    />
  );
};

export default CursorEffect;
