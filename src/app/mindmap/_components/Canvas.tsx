
"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import type { LayoutData } from '@/types/mindmap';
import { NodeRenderer } from './NodeRenderer';
import { ConnectorRenderer } from './ConnectorRenderer';

interface CanvasProps {
  layoutData: LayoutData | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onAddChildNode: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onStartEditing: (nodeId: string) => void;
  onFinishEditing: (nodeId: string, newText: string) => void;
  onAiSuggest: (nodeId: string) => void;
  onDragNode: (nodeId: string, dx: number, dy: number) => void;
  zoomLevel: number;
  canvasOffset: { x: number, y: number };
  onPan: (dx: number, dy: number) => void;
  onCanvasClick: () => void;
  onZoom: (amount: number) => void;
}

export function Canvas({
  layoutData,
  selectedNodeId,
  editingNodeId,
  onSelectNode,
  onAddChildNode,
  onDeleteNode,
  onStartEditing,
  onFinishEditing,
  onAiSuggest,
  onDragNode,
  zoomLevel,
  canvasOffset,
  onPan,
  onCanvasClick,
  onZoom,
}: CanvasProps) {
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPoint, setPanStartPoint] = useState({ x: 0, y: 0 });
  const [didPanSinceMouseDown, setDidPanSinceMouseDown] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSpacing = 40; // The base size of the grid squares

  if (!layoutData) {
    return (
      <div className="flex-grow flex items-center justify-center text-muted-foreground">
        Loading Mind Map...
      </div>
    );
  }

  const { nodes, connections, canvasWidth, canvasHeight } = layoutData;

  const handleWheel = (event: React.WheelEvent) => {
    // Always prevent default to stop page scroll or browser's native page zoom
    event.preventDefault();

    // The ctrlKey is the standard indicator for a pinch-to-zoom gesture on a trackpad
    if (event.ctrlKey) {
      const zoomAmount = -event.deltaY * 0.005; // Adjusted sensitivity for smoother zoom
      onZoom(zoomAmount);
    } else {
      // Standard mouse wheel or two-finger trackpad swipe for panning
      const dx = -event.deltaX;
      const dy = -event.deltaY;
      onPan(dx, dy);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    let targetElement = event.target as HTMLElement | null;
    let isClickOnNodeElement = false;
    while(targetElement && targetElement !== canvasRef.current) {
      if (targetElement.closest('[data-ai-hint="mindmap node"]')) {
        isClickOnNodeElement = true;
        break;
      }
      targetElement = targetElement.parentElement;
    }

    if (!isClickOnNodeElement && event.button === 0) { // Only pan with left click
      event.preventDefault();
      setIsPanning(true);
      setPanStartPoint({ x: event.clientX, y: event.clientY });
      setDidPanSinceMouseDown(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      event.preventDefault();
      setDidPanSinceMouseDown(true);
      const dx = event.clientX - panStartPoint.x;
      const dy = event.clientY - panStartPoint.y;
      onPan(dx, dy);
      setPanStartPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
      if (!didPanSinceMouseDown && event.target === canvasRef.current && event.button === 0) {
        onCanvasClick(); 
      }
    }
  };
  
  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-grow relative overflow-hidden bg-background cursor-grab select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      data-ai-hint="mindmap canvas"
    >
      {/* Grid Background */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundSize: `${gridSpacing * zoomLevel}px ${gridSpacing * zoomLevel}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
          backgroundImage: `radial-gradient(circle at center, var(--grid-dot-color) 1px, transparent 1px)`,
          opacity: 0.5,
        }}
      />
      <div
        className="relative"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translateX(${canvasOffset.x}px) translateY(${canvasOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0', 
        }}
      >
        <svg
          width={canvasWidth}
          height={canvasHeight}
          className="absolute top-0 left-0 pointer-events-none z-0"
        >
          {connections.map(conn => (
            <ConnectorRenderer 
              key={conn.id} 
              connection={conn}
              isSelected={selectedNodeId === conn.sourceId || selectedNodeId === conn.targetId} 
            />
          ))}
        </svg>

        {nodes.map(node => (
          <NodeRenderer
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isEditing={node.id === editingNodeId}
            onSelectNode={onSelectNode}
            onAddChildNode={onAddChildNode}
            onDeleteNode={onDeleteNode}
            onStartEditing={onStartEditing}
            onFinishEditing={onFinishEditing}
            onAiSuggest={onAiSuggest}
            onDragNode={onDragNode}
            isRoot={node.parentId === null}
            zoomLevel={zoomLevel}
          />
        ))}
      </div>
    </div>
  );
}
