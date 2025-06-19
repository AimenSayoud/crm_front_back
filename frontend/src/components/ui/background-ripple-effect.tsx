"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundCellsProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const BackgroundCells = ({ children, className, style }: BackgroundCellsProps) => {
  return (
    <div className={cn("relative h-screen flex justify-center overflow-hidden", className)} style={style}>
      <BackgroundCellCore />
      {children && (
        <div className="relative z-50 flex items-center justify-center h-full pointer-events-none select-none">
          {children}
        </div>
      )}
    </div>
  );
};

const BackgroundCellCore = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const size = 300;
  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="h-full absolute inset-0"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-full w-full pointer-events-none z-40 bg-gradient-to-b from-transparent via-transparent to-[#031F28]/50" />
        <div
          className="absolute inset-0 z-20 bg-transparent"
          style={{
            maskImage: `radial-gradient(${size / 4}px circle at center, white, transparent)`,
            WebkitMaskImage: `radial-gradient(${size / 4}px circle at center, white, transparent)`,
            WebkitMaskPosition: `${mousePosition.x - size / 2}px ${
              mousePosition.y - size / 2
            }px`,
            WebkitMaskSize: `${size}px`,
            maskSize: `${size}px`,
            pointerEvents: "none",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          <Pattern cellClassName="border-teal-300/60 relative z-[100]" />
        </div>
        <Pattern className="opacity-[0.8]" cellClassName="border-teal-600/40" />
      </div>
    </div>
  );
};

interface PatternProps {
  className?: string;
  cellClassName?: string;
}

const Pattern = ({ className, cellClassName }: PatternProps) => {
  const x = new Array(40).fill(0);
  const y = new Array(25).fill(0);
  const matrix = x.map((_, i) => y.map((_, j) => [i, j]));
  const [clickedCell, setClickedCell] = useState<[number, number] | null>(null);

  return (
    <div className={cn("flex flex-row relative z-30", className)}>
      {matrix.map((row, rowIdx) => (
        <div
          key={`matrix-row-${rowIdx}`}
          className="flex flex-col relative z-20 border-b"
        >
          {row.map((column, colIdx) => {
            const controls = useAnimation();

            useEffect(() => {
              if (clickedCell) {
                const distance = Math.sqrt(
                  Math.pow(clickedCell[0] - rowIdx, 2) +
                    Math.pow(clickedCell[1] - colIdx, 2)
                );
                controls.start({
                  opacity: [0, Math.max(0.1, 1 - distance * 0.15), 0],
                  transition: { duration: Math.min(distance * 0.1, 0.8) },
                });
              }
            }, [clickedCell, controls]);

            return (
              <div
                key={`matrix-col-${colIdx}`}
                className={cn(
                  "bg-transparent border-l border-b border-teal-500/30",
                  cellClassName
                )}
                onClick={() => setClickedCell([rowIdx, colIdx])}
              >
                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  whileHover={{
                    opacity: [0, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  animate={controls}
                  className="bg-[rgba(15,118,110,0.4)] h-12 w-12"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}; 