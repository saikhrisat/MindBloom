"use client";

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { LaidOutMindMapNode } from '@/types/mindmap';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, Trash2, Edit3, Sparkles, Check, XCircle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeRendererProps {
  node: LaidOutMindMapNode;
  isSelected: boolean;
  isEditing: boolean;
  onSelectNode: (nodeId: string) => void;
  onAddChildNode: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onStartEditing: (nodeId: string) => void;
  onFinishEditing: (nodeId: string, newText: string) => void;
  onAiSuggest: (nodeId: string) => void;
  onDragNode: (nodeId: string, dx: number, dy: number) => void;
  isRoot?: boolean;
  zoomLevel: number;
}

export function NodeRenderer({
  node,
  isSelected,
  isEditing,
  onSelectNode,
  onAddChildNode,
  onDeleteNode,
  onStartEditing,
  onFinishEditing,
  onAiSuggest,
  onDragNode,
  isRoot = false,
  zoomLevel,
}: NodeRendererProps) {
  const [editText, setEditText] = useState(node.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 }); 
  const nodeRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };

  const handleSaveEdit = () => {
    onFinishEditing(node.id, editText);
  };

  const handleCancelEdit = () => {
    setEditText(node.text); 
    onFinishEditing(node.id, node.text); 
  };
  
  const handleNodeClick = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLButtonElement || 
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).closest('button') ||
        (event.target as HTMLElement).closest('textarea')) {
      return;
    }
    if (!isEditing) {
      onSelectNode(node.id);
    }
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
     if (event.target instanceof HTMLButtonElement || 
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).closest('button') ||
        (event.target as HTMLElement).closest('textarea')) {
      return;
    }
    if (!isEditing) {
      onStartEditing(node.id);
    }
  };

  const handleMouseDownOnDragHandle = (event: React.MouseEvent) => {
    if (isEditing || event.button !== 0) return; 
    event.stopPropagation(); 
    setIsDragging(true);
    setDragStartPos({ x: event.clientX, y: event.clientY });
    document.body.style.cursor = 'grabbing'; 
    if (!isSelected) onSelectNode(node.id);
  };
  
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging || isEditing) return;
      event.preventDefault(); 

      const dx = event.clientX - dragStartPos.x;
      const dy = event.clientY - dragStartPos.y;
      
      onDragNode(node.id, dx, dy); 
      
      setDragStartPos({ x: event.clientX, y: event.clientY }); 
    };

    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (!isDragging) return;
      if (event.button !== 0 && isDragging) return; 

      setIsDragging(false);
      document.body.style.cursor = ''; 
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    } else {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      if (document.body.style.cursor === 'grabbing') { 
        document.body.style.cursor = '';
      }
    };
  }, [isDragging, dragStartPos, node.id, onDragNode, isEditing, zoomLevel]);

  const nodeColorStyle = node.color ? { backgroundColor: node.color } : {};
  const selectedClass = isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md';
  const newClass = node.isNew ? 'animate-fadeInScale' : '';
  const isAccentNode = node.color === 'hsl(var(--accent))';

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        ref={nodeRef}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          minHeight: node.height,
          position: 'absolute',
          zIndex: isDragging ? 1000 : (isSelected ? 20 : 10), 
          ...nodeColorStyle,
        }}
        className={cn(
          'p-0 duration-100 ease-in-out transform hover:shadow-xl flex flex-col bg-card', 
          selectedClass,
          newClass,
          { 'border-accent': isAccentNode }
        )}
        onClick={handleNodeClick}
        onDoubleClick={handleDoubleClick}
        data-node-id={node.id}
        data-ai-hint="mindmap node"
      >
        <CardHeader className="p-2 flex-shrink-0 flex flex-row items-start justify-between">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={editText}
              onChange={handleTextChange}
              onBlur={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              className="w-full text-sm resize-none h-auto min-h-[40px] flex-grow"
              placeholder="Node text"
              rows={Math.max(1, Math.min(5, Math.ceil(editText.length / (node.width / 8))))}
            />
          ) : (
            <div className="text-sm font-medium p-1 break-words whitespace-pre-wrap min-h-[24px] flex-grow select-none"> 
              {node.text || "Empty Node"}
            </div>
          )}
           {!isEditing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={dragHandleRef}
                  variant="ghost"
                  size="icon"
                  onMouseDown={handleMouseDownOnDragHandle}
                  className="h-7 w-7 cursor-grab ml-1 flex-shrink-0"
                  aria-label="Drag node"
                >
                  <GripVertical className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Drag Node</TooltipContent>
            </Tooltip>
           )}
        </CardHeader>
        
        <CardFooter className={cn(
            "p-1.5 border-t mt-auto flex-shrink-0",
            isEditing ? "justify-end" : "justify-between"
          )}
        >
          {isEditing ? (
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="h-7 w-7">
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save (Enter)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-7 w-7">
                    <XCircle className="w-4 h-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel (Esc)</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onStartEditing(node.id);}} className="h-7 w-7">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit (Double Click)</TooltipContent>
                </Tooltip>
                {!isRoot && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id);}} className="h-7 w-7">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onAiSuggest(node.id);}} className="h-7 w-7">
                       <Sparkles className={cn("w-4 h-4", isAccentNode ? 'text-accent-foreground' : 'text-accent')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>AI Suggest</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onAddChildNode(node.id);}} className="h-7 w-7">
                      <PlusCircle className="w-4 h-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Child</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
