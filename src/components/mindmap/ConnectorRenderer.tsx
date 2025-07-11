
"use client";

import type { Connection } from '@/types/mindmap';

interface ConnectorRendererProps {
  connection: Connection;
}

export function ConnectorRenderer({ connection }: ConnectorRendererProps) {
  const { from, to } = connection;

  // Check if coordinates are valid numbers
  if (isNaN(from.x) || isNaN(from.y) || isNaN(to.x) || isNaN(to.y)) {
    // console.warn("Skipping connector due to invalid coordinates:", connection);
    return null; // Don't render if coordinates are invalid
  }

  // Simple cubic Bezier curve calculation
  // Control points are placed horizontally between start and end points
  const controlXOffset = Math.abs(to.x - from.x) * 0.5; // Adjust this factor for curve shape
  const c1x = from.x + controlXOffset;
  const c1y = from.y;
  const c2x = to.x - controlXOffset;
  const c2y = to.y;

  const pathData = `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;

  return (
    <path
      d={pathData}
      stroke="hsl(var(--border))" // Use theme's border color
      strokeWidth="2"
      fill="none"
      className="transition-all duration-300 ease-in-out" // Smooth transition for path changes
      data-testid={`connector-${connection.id}`}
    />
  );
}

