"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
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
        const rowPoints: Point[] = [];
        for (let col = 0; col < cols; col++) {
          const x = col * gridSize;
          const y = row * gridSize;
          rowPoints.push({ x, y, baseX: x, baseY: y });
        }
        points.push(rowPoints);
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
      for (const rowPoints of points) {
        for (const point of rowPoints) {
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
      for (const rowPoints of points) {
        ctx.beginPath();
        rowPoints.forEach((point, col) => {
          if (col === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }

      // Vertical lines
      const firstRow = points[0];
      if (firstRow) {
        for (let col = 0; col < firstRow.length; col++) {
          ctx.beginPath();
          points.forEach((rowPoints, row) => {
            const point = rowPoints[col];
            if (point) {
              if (row === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            }
          });
          ctx.stroke();
        }
      }

      // Draw dots at intersections
      ctx.fillStyle = config.color;
      for (const rowPoints of points) {
        for (const point of rowPoints) {
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
