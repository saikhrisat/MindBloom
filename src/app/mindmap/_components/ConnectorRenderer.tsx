
"use client";

import type { Connection } from '@/types/mindmap';
import { cn } from '@/lib/utils';

interface ConnectorRendererProps {
  connection: Connection;
  isSelected: boolean;
}

export function ConnectorRenderer({ connection, isSelected }: ConnectorRendererProps) {
  const { from, to } = connection;

  if (isNaN(from.x) || isNaN(from.y) || isNaN(to.x) || isNaN(to.y)) {
    return null;
  }

  const controlXOffset = Math.abs(to.x - from.x) * 0.5;
  const c1x = from.x + controlXOffset;
  const c1y = from.y;
  const c2x = to.x - controlXOffset;
  const c2y = to.y;

  const pathData = `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;

  return (
    <path
      d={pathData}
      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
      strokeWidth="2"
      fill="none"
      className={cn(
        "transition-all duration-300 ease-in-out",
        { "stroke-primary": isSelected, "stroke-border": !isSelected }
      )}
      data-testid={`connector-${connection.id}`}
    />
  );
}
