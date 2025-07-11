
export interface MindMapNodeData {
  id: string;
  text: string;
  children: MindMapNodeData[];
  color?: string; // Optional: For AI suggestions or specific highlights
  isNew?: boolean; // Optional: For animation on add
  manualX?: number; // Optional: Manually set X position
  manualY?: number; // Optional: Manually set Y position
}

export interface MindMap {
  id: string; // Unique ID for the mind map itself
  title: string;
  root: MindMapNodeData;
  selectedNodeId?: string | null;
  lastModified: number; // Timestamp of last modification
}

// For rendering with layout information:
export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface LaidOutMindMapNode extends MindMapNodeData, Position, Dimensions {
  children: LaidOutMindMapNode[]; // Children are also laid out
  parentId?: string | null;
}

export interface Connection {
  from: Position; // Connection point of parent (initial layout, may be updated)
  to: Position;   // Connection point of child (initial layout, may be updated)
  id: string;     // Unique ID, e.g., parentId-childId
  sourceId: string; // Explicit source node ID
  targetId: string; // Explicit target node ID
}

export interface LayoutData {
  nodes: LaidOutMindMapNode[]; // Flattened list of nodes with layout info
  connections: Connection[];
  canvasWidth: number;
  canvasHeight: number;
}

export const NODE_WIDTH = 200;
export const NODE_MIN_HEIGHT = 60; // Minimum height for a node
export const NODE_VERTICAL_PADDING = 20; // top + bottom padding
export const NODE_HEADER_HEIGHT = 30; // Space for text
export const NODE_ACTIONS_HEIGHT = 40; // Space for buttons

export const HORIZONTAL_SPACING = 80;
export const VERTICAL_SPACING = 40;
