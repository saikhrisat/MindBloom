
"use client";

import type React from 'react';
import { useTheme } from "next-themes";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusSquare, ZoomIn, ZoomOut, TreeDeciduous, Sun, Moon, Save, Trash2, FolderOpen } from 'lucide-react'; // Changed Sparkles to TreeDeciduous
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolbarProps {
  mindMapTitle: string;
  onMindMapTitleChange: (newTitle: string) => void;
  onNewMindMap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  currentZoom: number;
  onSaveMindMap: () => void;
  onDeleteCurrentMindMap: () => void;
  onOpenLoadMapsDialog: () => void; 
}

export function Toolbar({
  mindMapTitle,
  onMindMapTitleChange,
  onNewMindMap,
  onZoomIn,
  onZoomOut,
  currentZoom,
  onSaveMindMap,
  onDeleteCurrentMindMap,
  onOpenLoadMapsDialog,
}: ToolbarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <TooltipProvider>
      <div className="p-4 bg-card border-b shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <TreeDeciduous className="w-7 h-7 text-primary" /> {/* Changed from Sparkles */}
          <Input
            type="text"
            value={mindMapTitle}
            onChange={(e) => onMindMapTitleChange(e.target.value)}
            placeholder="Mind Map Title"
            className="text-lg font-semibold w-full sm:w-auto max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onNewMindMap} aria-label="New Mind Map">
                <PlusSquare className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Mind Map</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onSaveMindMap} aria-label="Save Mind Map">
                <Save className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Mind Map</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onOpenLoadMapsDialog} aria-label="Load Saved Maps">
                <FolderOpen className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load Saved Maps</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" onClick={onDeleteCurrentMindMap} aria-label="Delete Current Mind Map">
                <Trash2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Current Mind Map</TooltipContent>
          </Tooltip>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onZoomOut} aria-label="Zoom Out">
                  <ZoomOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            <span className="text-sm text-muted-foreground w-10 text-center">{(currentZoom * 100).toFixed(0)}%</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onZoomIn} aria-label="Zoom In">
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

