"use client";

import type { MindMap } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FileText, PlusSquare, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

interface LoadMapsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maps: MindMap[];
  onLoadMap: (map: MindMap) => void;
  onDeleteMap: (mapId: string) => void;
  onCreateNew: () => void;
}

export function LoadMapsDialog({
  isOpen,
  onClose,
  maps,
  onLoadMap,
  onDeleteMap,
  onCreateNew,
}: LoadMapsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Load Saved Mind Maps
          </DialogTitle>
          <DialogDescription>
            Select a mind map to load, or create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {maps.length === 0 ? (
            <div className="text-center text-muted-foreground h-40 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 mb-4 text-gray-400" />
              <p>No saved mind maps found.</p>
              <p className="text-sm">Start by creating a new one!</p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <ul className="space-y-2 pr-3">
                {maps.map((map) => (
                  <li
                    key={map.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{map.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {format(new Date(map.lastModified), "PPpp")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadMap(map)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon" 
                        onClick={() => onDeleteMap(map.id)}
                        aria-label={`Delete ${map.title}`}
                        className="h-8 w-8" 
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
           <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreateNew}>
            <PlusSquare className="w-4 h-4 mr-2" />
            Create New Mind Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
