"use client";

import React, { useEffect, useRef } from "react";
import styles from "./InteractiveMesh.module.css";

interface Point {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
}

interface InteractiveMeshProps {
  gridSize?: number;
  color?: string;
  opacity?: number;
  bendStrength?: number;
  bendRadius?: number;
}

export const InteractiveMesh: React.FC<InteractiveMeshProps> = ({
  gridSize = 40,
  color = "rgba(234, 124, 28, 0.15)",
  opacity = 1,
  bendStrength = 30,
  bendRadius = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[][]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const configRef = useRef({ color, opacity, bendStrength, bendRadius });

  // Keep config ref in sync
  useEffect(() => {
    configRef.current = { color, opacity, bendStrength, bendRadius };
  }, [color, opacity, bendStrength, bendRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initPoints = (width: number, height: number) => {
      const cols = Math.ceil(width / gridSize) + 2;
      const rows = Math.ceil(height / gridSize) + 2;
      const points: Point[][] = [];

      for (let row = 0; row < rows; row++) {
        points[row] = [];
        for (let col = 0; col < cols; col++) {
          const x = col * gridSize;
          const y = row * gridSize;
          points[row][col] = { x, y, baseX: x, baseY: y };
        }
      }

      pointsRef.current = points;
    };

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const points = pointsRef.current;
      const mouse = mouseRef.current;
      const config = configRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update points based on mouse position
      for (let row = 0; row < points.length; row++) {
        for (let col = 0; col < points[row].length; col++) {
          const point = points[row][col];
          const dx = mouse.x - point.baseX;
          const dy = mouse.y - point.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.bendRadius) {
            const force =
              (1 - distance / config.bendRadius) * config.bendStrength;
            const angle = Math.atan2(dy, dx);
            point.x = point.baseX - Math.cos(angle) * force;
            point.y = point.baseY - Math.sin(angle) * force;
          } else {
            // Smooth return to base position
            point.x += (point.baseX - point.x) * 0.1;
            point.y += (point.baseY - point.y) * 0.1;
          }
        }
      }

      // Draw grid lines
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = config.opacity;

      // Horizontal lines
      for (let row = 0; row < points.length; row++) {
        ctx.beginPath();
        for (let col = 0; col < points[row].length; col++) {
          const point = points[row][col];
          if (col === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();
      }

      // Vertical lines
      for (let col = 0; col < points[0]?.length; col++) {
        ctx.beginPath();
        for (let row = 0; row < points.length; row++) {
          const point = points[row][col];
          if (row === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();
      }

      // Draw dots at intersections
      ctx.fillStyle = config.color;
      for (let row = 0; row < points.length; row++) {
        for (let col = 0; col < points[row].length; col++) {
          const point = points[row][col];
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPoints(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gridSize]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};
