
"use client";

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MindMap, MindMapNodeData, LayoutData, LaidOutMindMapNode, Connection } from '@/types/mindmap';
import { Toolbar } from './mindmap/_components/Toolbar';
import { Canvas } from './mindmap/_components/Canvas';
import { AiSuggestionsDialog } from './mindmap/_components/AiSuggestionsDialog';
import { LoadMapsDialog } from './mindmap/_components/LoadMapsDialog';
import { 
  loadMindMapCollection, 
  saveMindMapToCollection, 
  deleteMindMapFromCollectionById,
  getStoredActiveMindMapId,
  setStoredActiveMindMapId
} from '@/lib/localStorage';
import { exportToMarkdown } from '@/lib/exportUtils';
import { calculateLayout } from '@/lib/layout';
import { useToast } from '@/hooks/use-toast';
import { suggestChildNodes, type SuggestChildNodesInput } from '@/ai/flows/suggest-child-nodes';
import { v4 as uuidv4 } from 'uuid'; 
import { Sparkles } from 'lucide-react';

const generateNewMindMap = (): MindMap => {
  const newRootId = uuidv4();
  const newMapId = uuidv4();
  return {
    id: newMapId,
    title: 'My New Mind Map',
    root: {
      id: newRootId,
      text: 'Central Idea',
      children: [],
    },
    selectedNodeId: newRootId,
    lastModified: Date.now(),
  };
};

export default function MindMapPage() {
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTargetNode, setAiTargetNode] = useState<MindMapNodeData | null>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const [isLoadMapsDialogOpen, setIsLoadMapsDialogOpen] = useState(false);
  const [savedMindMaps, setSavedMindMaps] = useState<MindMap[]>([]);

  const { toast } = useToast();

  const setActiveMindMap = useCallback((mapToActivate: MindMap | null) => {
    if (!mapToActivate) {
      setMindMap(null);
      setSelectedNodeId(null);
      setStoredActiveMindMapId(null);
      setLayoutData(null); 
      return;
    }
    
    const ensureNodeIdsRecursive = (node: MindMapNodeData): MindMapNodeData => ({
        ...node,
        id: node.id || uuidv4(), 
        children: (node.children || []).map(ensureNodeIdsRecursive),
    });
    
    const updatedRootNode = ensureNodeIdsRecursive(mapToActivate.root);
    const selectedId = mapToActivate.selectedNodeId || updatedRootNode.id;
    
    const fullMapToActivate: MindMap = { 
      ...mapToActivate, 
      root: updatedRootNode, 
      selectedNodeId: selectedId 
    };

    setMindMap(fullMapToActivate);
    setSelectedNodeId(selectedId); 
    setStoredActiveMindMapId(fullMapToActivate.id);
    setCanvasOffset({ x: 0, y: 0 }); 
    setZoomLevel(1); 
  }, []); 
  
  useEffect(() => {
    const collection = loadMindMapCollection(); 
    setSavedMindMaps(collection);
    const activeId = getStoredActiveMindMapId();
    let mapToLoad: MindMap | undefined = collection.find(m => m.id === activeId);

    if (!mapToLoad && collection.length > 0) {
      mapToLoad = collection[0]; 
    }

    if (mapToLoad) {
      setActiveMindMap(mapToLoad);
    } else {
      const newMap = generateNewMindMap();
      setActiveMindMap(newMap);
    }
  }, [setActiveMindMap]); 
  
  useEffect(() => {
    if (mindMap && mindMap.root) {
      setLayoutData(calculateLayout(JSON.parse(JSON.stringify(mindMap.root)))); 
    } else {
      setLayoutData(null);
    }
  }, [mindMap?.root, mindMap?.id]); 
  
  const findAndUpdateNode = useCallback((nodes: MindMapNodeData[], nodeId: string, updateFn: (node: MindMapNodeData) => MindMapNodeData): MindMapNodeData[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return updateFn(node);
      }
      if (node.children && node.children.length > 0) {
        const updatedChildren = findAndUpdateNode(node.children, nodeId, updateFn);
        if (updatedChildren !== node.children) { 
           return { ...node, children: updatedChildren };
        }
      }
      return node;
    });
  }, []);

  const findNode = useCallback((rootNode: MindMapNodeData | undefined, nodeId: string): MindMapNodeData | null => {
    if (!rootNode) return null;
    const nodesToSearch: MindMapNodeData[] = [rootNode];
    while(nodesToSearch.length > 0) {
        const currentNode = nodesToSearch.pop();
        if (currentNode?.id === nodeId) return currentNode;
        if (currentNode?.children) {
            nodesToSearch.push(...currentNode.children);
        }
    }
    return null;
  }, []);

  const getNodePathText = useCallback((rootNode: MindMapNodeData | undefined, targetNodeId: string): string => {
    if (!rootNode || !targetNodeId) return "";
    const path: string[] = [];
    
    function findPathRecursive(currentNode: MindMapNodeData, currentPath: string[]): boolean {
        const newPath = [...currentPath, currentNode.text];
        if (currentNode.id === targetNodeId) {
            path.push(...newPath);
            return true;
        }
        if (currentNode.children) {
            for (const child of currentNode.children) {
                if (findPathRecursive(child, newPath)) {
                    return true;
                }
            }
        }
        return false;
    }

    if (rootNode.id === targetNodeId) { 
        return rootNode.text;
    }
    if (findPathRecursive(rootNode, [])) { 
       return path.join(' > ');
    }
    return "";
  }, []);

  const updateMindMapState = useCallback((updater: (prev: MindMap) => MindMap | null) => {
    setMindMap(prev => {
      if (!prev) return null;
      const newState = updater(prev);
      if (newState) {
        const selectedId = newState.selectedNodeId || newState.root?.id || null;
        return {...newState, selectedNodeId: selectedId, lastModified: Date.now() };
      }
      return null;
    });
  }, []);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setEditingNodeId(null); 
    updateMindMapState(prev => prev ? ({ ...prev, selectedNodeId: nodeId }) : null);
  }, [updateMindMapState]);

  const handleCanvasClick = useCallback(() => {
    if (mindMap?.root.id) {
       setSelectedNodeId(mindMap.root.id);
       updateMindMapState(prev => prev ? ({ ...prev, selectedNodeId: prev.root.id }) : null);
    }
    setEditingNodeId(null);
  }, [mindMap?.root.id, updateMindMapState]);
  
  const handleFinishEditing = useCallback((nodeId: string, newText: string) => {
    updateMindMapState(prev => {
      if (!prev || !prev.root) return null;
      return {
        ...prev,
        root: findAndUpdateNode([prev.root], nodeId, node => ({ ...node, text: newText, isNew: false }))[0],
      }
    });
    setEditingNodeId(null);
  }, [updateMindMapState, findAndUpdateNode]);

  const handleAddChildNode = useCallback((parentId: string) => {
    if (!mindMap) return;
    const newNodeId = uuidv4();
    updateMindMapState(prev => {
      if (!prev || !prev.root) return null;
      return {
        ...prev,
        root: findAndUpdateNode([prev.root], parentId, node => ({
          ...node,
          children: [...(node.children || []), { id: newNodeId, text: 'New Idea', children: [] as MindMapNodeData[], isNew: true }],
        }))[0],
      }
    });
    setSelectedNodeId(newNodeId); 
    setTimeout(() => setEditingNodeId(newNodeId), 50);
  }, [mindMap, updateMindMapState, findAndUpdateNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!mindMap || !mindMap.root || nodeId === mindMap.root.id) {
      toast({ title: "Cannot delete root node", variant: "destructive" });
      return;
    }
    let parentOfDeletedNodeId: string | null = null;

    function findParentAndMarkForDeletion(nodes: MindMapNodeData[], idToDelete: string, currentParentId: string | null): MindMapNodeData[] {
       return nodes.filter(n => {
            if (n.id === idToDelete) {
                parentOfDeletedNodeId = currentParentId; 
                return false; 
            }
            if (n.children) {
                n.children = findParentAndMarkForDeletion(n.children, idToDelete, n.id);
            }
            return true;
        });
    }

    updateMindMapState(prev => {
      if (!prev || !prev.root) return null;
      const newRoot = findParentAndMarkForDeletion([JSON.parse(JSON.stringify(prev.root))], nodeId, null)[0];
      return { ...prev, root: newRoot };
    });
    
    const newSelectedId = parentOfDeletedNodeId || mindMap.root.id;
    setSelectedNodeId(newSelectedId); 
    updateMindMapState(prev => prev ? { ...prev, selectedNodeId: newSelectedId } : null);

  }, [mindMap, updateMindMapState, toast]);

  const handleAiSuggest = useCallback(async (nodeId: string) => {
    if (!mindMap || !mindMap.root) return;
    const targetNode = findNode(mindMap.root, nodeId);
    if (!targetNode) return;

    setAiTargetNode(targetNode);
    setIsAiDialogOpen(true);
    setAiSuggestions([]); 
    setIsAiLoading(true);

    try {
      const branchContext = getNodePathText(mindMap.root, nodeId);
      const input: SuggestChildNodesInput = {
        parentNodeText: targetNode.text,
        mindMapContext: mindMap.title, 
        branchContext: branchContext,
        numberOfSuggestions: 5,
      };
      const result = await suggestChildNodes(input);
      setAiSuggestions(result.suggestions);
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ title: "AI Suggestion Failed", description: (error as Error).message, variant: "destructive" });
      setAiSuggestions([]); 
    } finally {
      setIsAiLoading(false);
    }
  }, [mindMap, findNode, getNodePathText, toast]);

  const handleAddAiSuggestion = useCallback((suggestionText: string) => {
    if (!aiTargetNode || !mindMap) return;
    const newNodeId = uuidv4();
    updateMindMapState(prev => {
      if (!prev || !prev.root) return null; 
      return {
        ...prev,
        root: findAndUpdateNode([prev.root], aiTargetNode.id, node => ({
          ...node,
          children: [...(node.children || []), { id: newNodeId, text: suggestionText, children: [], color: 'hsl(var(--accent))', isNew: true }],
        }))[0],
      }
    });
    setSelectedNodeId(newNodeId);
    setIsAiDialogOpen(false); 
  }, [aiTargetNode, mindMap, updateMindMapState, findAndUpdateNode]);

  const handleMindMapTitleChange = useCallback((newTitle: string) => {
    updateMindMapState(prev => prev ? ({ ...prev, title: newTitle }) : null);
  }, [updateMindMapState]);

  const handleNewMindMap = useCallback(() => {
    const newMap = generateNewMindMap();
    setActiveMindMap(newMap);
    toast({ title: "New Mind Map Created", description: "Start brainstorming! Save when you're ready." });
  }, [setActiveMindMap, toast]);

  const handleSaveMindMap = useCallback(() => {
    if (mindMap) {
      const updatedMap = { ...mindMap, lastModified: Date.now(), selectedNodeId }; 
      const updatedCollection = saveMindMapToCollection(updatedMap);
      setSavedMindMaps(updatedCollection); 
      setStoredActiveMindMapId(updatedMap.id); 
      setMindMap(prev => prev ? ({...prev, ...updatedMap}) : updatedMap ); 
      toast({ title: "Mind Map Saved!", description: `"${updatedMap.title}" has been saved to your browser.` });
    }
  }, [mindMap, selectedNodeId, toast]);

  const handleDeleteCurrentMindMap = useCallback(() => {
    if (!mindMap) return;
    if (window.confirm(`Are you sure you want to delete "${mindMap.title}"? This action cannot be undone.`)) {
      const remainingMaps = deleteMindMapFromCollectionById(mindMap.id);
      setSavedMindMaps([...remainingMaps].sort((a, b) => b.lastModified - a.lastModified));
      toast({ title: "Mind Map Deleted", description: `"${mindMap.title}" has been removed.` });

      if (remainingMaps.length > 0) {
        setActiveMindMap(remainingMaps[0]); 
      } else {
        const newMap = generateNewMindMap();
        setActiveMindMap(newMap);
      }
    }
  }, [mindMap, setActiveMindMap, toast]);
  
  const handleOpenLoadMapsDialog = useCallback(() => {
    setSavedMindMaps(loadMindMapCollection()); 
    setIsLoadMapsDialogOpen(true);
  }, []);

  const handleLoadMapFromDialog = useCallback((mapToLoad: MindMap) => {
    setActiveMindMap(mapToLoad);
    setIsLoadMapsDialogOpen(false);
    toast({ title: "Mind Map Loaded", description: `"${mapToLoad.title}" is now active.` });
  }, [setActiveMindMap, toast]);

  const handleDeleteMapFromDialog = useCallback((mapIdToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this mind map from your saved list? This action cannot be undone.")) {
      const updatedCollection = deleteMindMapFromCollectionById(mapIdToDelete);
      setSavedMindMaps([...updatedCollection].sort((a, b) => b.lastModified - a.lastModified));
      toast({ title: "Mind Map Deleted from Saved List" });
      
      if (mindMap?.id === mapIdToDelete) { 
        if (updatedCollection.length > 0) {
          setActiveMindMap(updatedCollection[0]); 
        } else {
          setActiveMindMap(generateNewMindMap()); 
        }
      }
    }
  }, [mindMap, setActiveMindMap, toast]); 


  const handleZoom = useCallback((amount: number) => {
    setZoomLevel(prev => Math.max(0.1, Math.min(prev + amount, 3)));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);
  
 const handleDragNode = useCallback((nodeId: string, dx: number, dy: number) => {
    setMindMap(currentMindMap => {
        if (!currentMindMap || !currentMindMap.root || !layoutData) return currentMindMap;
        
        const scaledDx = dx / zoomLevel;
        const scaledDy = dy / zoomLevel;

        const findNodeInTreeRecursive = (nodes: MindMapNodeData[], id: string): MindMapNodeData | null => {
          for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
              const found = findNodeInTreeRecursive(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        
        const updateNodePosition = (nodeToUpdate: MindMapNodeData): MindMapNodeData => {
            const originalLayoutNode = layoutData.nodes.find(n => n.id === nodeToUpdate.id);
            const existingNodeFromCurrentState = findNodeInTreeRecursive([currentMindMap.root], nodeToUpdate.id);

            const baseX = existingNodeFromCurrentState?.manualX !== undefined 
                ? existingNodeFromCurrentState.manualX 
                : (originalLayoutNode?.x || 0);
            const baseY = existingNodeFromCurrentState?.manualY !== undefined 
                ? existingNodeFromCurrentState.manualY 
                : (originalLayoutNode?.y || 0);
            
            return {
              ...nodeToUpdate,
              manualX: baseX + scaledDx,
              manualY: baseY + scaledDy,
              isNew: false, 
            };
        };
        const newRoot = findAndUpdateNode([JSON.parse(JSON.stringify(currentMindMap.root))], nodeId, updateNodePosition)[0];
        if (!newRoot) return currentMindMap; 
        return { ...currentMindMap, root: newRoot, lastModified: Date.now() };
    });
  }, [findAndUpdateNode, zoomLevel, layoutData]); 

  const handleExportMarkdown = useCallback(() => {
    if (!mindMap) return;

    const markdownContent = exportToMarkdown(mindMap);
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = mindMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeTitle || 'mindmap'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Markdown Exported!', description: `"${mindMap.title}.md" has been downloaded.` });
  }, [mindMap, toast]);


  const finalLayoutData: LayoutData | null = useMemo(() => {
    if (!layoutData || !mindMap || !mindMap.root) {
      return null;
    }

    const mindMapNodesMap = new Map<string, MindMapNodeData>();
    const populateMap = (node: MindMapNodeData) => {
        mindMapNodesMap.set(node.id, node);
        (node.children || []).forEach(populateMap);
    };
    populateMap(mindMap.root);
    
    const currentProcessedNodes: LaidOutMindMapNode[] = layoutData.nodes.map(originalLayoutNode => {
      const mindMapNodeFromState = mindMapNodesMap.get(originalLayoutNode.id);
      
      return {
        ...originalLayoutNode, 
        text: mindMapNodeFromState?.text ?? originalLayoutNode.text, 
        children: (mindMapNodeFromState?.children || []).map(c => mindMapNodesMap.get(c.id) || c),
        color: mindMapNodeFromState?.color,
        isNew: mindMapNodeFromState?.isNew,
        x: mindMapNodeFromState?.manualX !== undefined ? mindMapNodeFromState.manualX : originalLayoutNode.x,
        y: mindMapNodeFromState?.manualY !== undefined ? mindMapNodeFromState.manualY : originalLayoutNode.y,
        manualX: mindMapNodeFromState?.manualX,
        manualY: mindMapNodeFromState?.manualY,
        width: originalLayoutNode.width, 
        height: originalLayoutNode.height,
      };
    });

    const currentProcessedNodesMap = new Map(currentProcessedNodes.map(n => [n.id, n]));

    const currentProcessedConnections: Connection[] = (layoutData.connections || [])
     .map(connection => {
        const sourceNode = currentProcessedNodesMap.get(connection.sourceId);
        const targetNode = currentProcessedNodesMap.get(connection.targetId);

        if (!sourceNode || !targetNode) {
          console.warn(`Skipping connection ${connection.id}: Source ${connection.sourceId} or Target ${connection.targetId} not found.`);
          return null; 
        }
        
        const fromX = sourceNode.x + sourceNode.width; 
        const fromY = sourceNode.y + sourceNode.height / 2;
        const toX = targetNode.x; 
        const toY = targetNode.y + targetNode.height / 2;
         
        return {
          ...connection, 
          from: { x: fromX, y: fromY },
          to: { x: toX, y: toY }
        };
      }).filter(conn => conn !== null) as Connection[];

    let newCanvasWidth = 0;
    let newCanvasHeight = 0;
    currentProcessedNodes.forEach(node => {
        newCanvasWidth = Math.max(newCanvasWidth, node.x + node.width);
        newCanvasHeight = Math.max(newCanvasHeight, node.y + node.height);
    });
    
    return {
      nodes: currentProcessedNodes,
      connections: currentProcessedConnections,
      canvasWidth: Math.max(layoutData.canvasWidth, newCanvasWidth + 50), 
      canvasHeight: Math.max(layoutData.canvasHeight, newCanvasHeight + 50),
    };
  }, [layoutData, mindMap]); 


  if (!mindMap || !finalLayoutData) { 
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-lg text-muted-foreground">Loading MindBloom...</p>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Toolbar
        mindMapTitle={mindMap.title}
        onMindMapTitleChange={handleMindMapTitleChange}
        onNewMindMap={handleNewMindMap}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        currentZoom={zoomLevel}
        onSaveMindMap={handleSaveMindMap}
        onDeleteCurrentMindMap={handleDeleteCurrentMindMap}
        onOpenLoadMapsDialog={handleOpenLoadMapsDialog}
        onExportMarkdown={handleExportMarkdown}
      />
      <Canvas
        layoutData={finalLayoutData}
        selectedNodeId={selectedNodeId}
        editingNodeId={editingNodeId}
        onSelectNode={handleSelectNode}
        onAddChildNode={handleAddChildNode}
        onDeleteNode={handleDeleteNode}
        onStartEditing={setEditingNodeId}
        onFinishEditing={handleFinishEditing}
        onAiSuggest={handleAiSuggest}
        onDragNode={handleDragNode}
        zoomLevel={zoomLevel}
        canvasOffset={canvasOffset}
        onPan={handlePan}
        onCanvasClick={handleCanvasClick}
        onZoom={handleZoom}
      />
      {aiTargetNode && (
        <AiSuggestionsDialog
          isOpen={isAiDialogOpen}
          onClose={() => setIsAiDialogOpen(false)}
          parentNodeText={aiTargetNode.text}
          suggestions={aiSuggestions}
          isLoading={isAiLoading}
          onAddSuggestion={handleAddAiSuggestion}
        />
      )}
      <LoadMapsDialog
        isOpen={isLoadMapsDialogOpen}
        onClose={() => setIsLoadMapsDialogOpen(false)}
        maps={savedMindMaps}
        onLoadMap={handleLoadMapFromDialog}
        onDeleteMap={handleDeleteMapFromDialog}
        onCreateNew={() => {
          handleNewMindMap(); 
          setIsLoadMapsDialogOpen(false); 
        }}
      />
    </div>
  );
}

    