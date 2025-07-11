"use client";

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
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AiSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentNodeText: string;
  suggestions: string[];
  isLoading: boolean;
  onAddSuggestion: (suggestionText: string) => void;
}

export function AiSuggestionsDialog({
  isOpen,
  onClose,
  parentNodeText,
  suggestions,
  isLoading,
  onAddSuggestion,
}: AiSuggestionsDialogProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const handleToggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleAddSelected = () => {
    selectedSuggestions.forEach(onAddSuggestion);
    setSelectedSuggestions([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Suggestions
          </DialogTitle>
          <DialogDescription>
            Suggestions for child nodes of: <span className="font-semibold">{parentNodeText}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Generating ideas...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-center text-muted-foreground h-40 flex items-center justify-center">No suggestions available right now.</p>
          ) : (
            <ScrollArea className="h-60">
              <div className="space-y-2 pr-4">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant={selectedSuggestions.includes(suggestion) ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleToggleSuggestion(suggestion)}
                  >
                    {selectedSuggestions.includes(suggestion) && <CheckCircle className="w-4 h-4 mr-2 text-primary-foreground" />}
                    {suggestion}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAddSelected} 
            disabled={isLoading || selectedSuggestions.length === 0}
          >
            Add Selected ({selectedSuggestions.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
