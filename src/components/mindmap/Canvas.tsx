
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { LayoutData } from '@/types/mindmap';
import { NodeRenderer } from './NodeRenderer';
import { ConnectorRenderer } from './ConnectorRenderer';

interface CanvasProps {
  layoutData: LayoutData | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodeText: (nodeId: string, newText: string) => void;
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
  onUpdateNodeText,
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

  if (!layoutData) {
    return (
      <div className="flex-grow flex items-center justify-center text-muted-foreground">
        Loading Mind Map...
      </div>
    );
  }

  const { nodes, connections, canvasWidth, canvasHeight } = layoutData;

  const handleWheelZoom = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomSensitivity = 0.0001; 
    const zoomAmount = -event.deltaY * zoomSensitivity;
    onZoom(zoomAmount);
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
      // Only call onCanvasClick if no panning occurred AND click was on canvas background AND it was a left click
      if (!didPanSinceMouseDown && event.target === canvasRef.current && event.button === 0) {
        onCanvasClick(); 
      }
    }
  };
  
  const handleMouseLeave = (event: React.MouseEvent) => {
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
      className="flex-grow relative overflow-hidden bg-background cursor-grab select-none" // Added select-none
      onWheel={handleWheelZoom}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      data-ai-hint="mindmap canvas"
    >
      <div
        className="relative" // Removed transition-transform for smoother drag/pan
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
            <ConnectorRenderer key={conn.id} connection={conn} />
          ))}
        </svg>

        {nodes.map(node => (
          <NodeRenderer
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isEditing={node.id === editingNodeId}
            onSelectNode={onSelectNode}
            onUpdateNodeText={onUpdateNodeText}
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

