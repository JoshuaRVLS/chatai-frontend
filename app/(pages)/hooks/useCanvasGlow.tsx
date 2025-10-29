"use client";
import { useEffect, useRef } from "react";

export const useCanvasGlow = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    let mx = 0,
      my = 0,
      gx = 0,
      gy = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const animate = () => {
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 250);
      g.addColorStop(0, "rgba(0,200,255,0.12)");
      g.addColorStop(0.5, "rgba(0,150,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("mousemove", move);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return ref;
};
