
import type { MindMapNodeData, LaidOutMindMapNode, Connection, LayoutData, Position } from '@/types/mindmap';
import { NODE_WIDTH, NODE_MIN_HEIGHT, HORIZONTAL_SPACING, VERTICAL_SPACING, NODE_VERTICAL_PADDING, NODE_HEADER_HEIGHT, NODE_ACTIONS_HEIGHT } from '@/types/mindmap';

// Estimate node height based on text length (simple estimation)
function estimateNodeHeight(text: string): number {
  const lines = Math.ceil(text.length / 25); // Assume ~25 chars per line for NODE_WIDTH
  const textHeight = Math.max(NODE_HEADER_HEIGHT, lines * 18); // 18px per line height estimate
  return Math.max(NODE_MIN_HEIGHT, textHeight + NODE_VERTICAL_PADDING + NODE_ACTIONS_HEIGHT);
}

interface RecursiveLayoutResult {
  node: LaidOutMindMapNode;
  subtreeHeight: number; // Total height occupied by this node and its children
  subtreeWidth: number;  // Total width from this node to its furthest descendant
}

function layoutNodeRecursive(
  dataNode: MindMapNodeData,
  x: number,
  y: number,
  parentId: string | null
): RecursiveLayoutResult {
  const nodeHeight = estimateNodeHeight(dataNode.text);
  const laidOutNode: LaidOutMindMapNode = {
    ...dataNode,
    x,
    y,
    width: NODE_WIDTH,
    height: nodeHeight,
    parentId,
    children: [], // Will be populated recursively
  };

  let currentYOffset = 0;
  let maxChildSubtreeWidth = 0;

  for (const childData of dataNode.children) {
    const childResult = layoutNodeRecursive(
      childData,
      x + NODE_WIDTH + HORIZONTAL_SPACING,
      y + currentYOffset,
      dataNode.id
    );
    laidOutNode.children.push(childResult.node);
    currentYOffset += childResult.subtreeHeight + VERTICAL_SPACING;
    maxChildSubtreeWidth = Math.max(maxChildSubtreeWidth, NODE_WIDTH + HORIZONTAL_SPACING + childResult.subtreeWidth);
  }
  
  const selfSubtreeHeight = Math.max(nodeHeight, currentYOffset > 0 ? currentYOffset - VERTICAL_SPACING : 0);
  
  // Adjust parent Y to be vertically centered with respect to its children block
  if (laidOutNode.children.length > 0) {
    const childrenBlockHeight = currentYOffset - VERTICAL_SPACING;
    const desiredParentY = y + (childrenBlockHeight / 2) - (nodeHeight / 2);
    
    // Shift all children if parent Y moved
    const yShift = desiredParentY - laidOutNode.y;
    if (Math.abs(yShift) > 0.1) { // Avoid tiny shifts due to float precision
        laidOutNode.y = desiredParentY;
        laidOutNode.children.forEach(child => {
            function shiftRecursively(node: LaidOutMindMapNode, shiftAmount: number) {
                node.y += shiftAmount;
                node.children.forEach(c => shiftRecursively(c, shiftAmount));
            }
            shiftRecursively(child, yShift);
        });
    }
  }
  
  const selfSubtreeWidth = dataNode.children.length > 0 ? maxChildSubtreeWidth : NODE_WIDTH;

  return { node: laidOutNode, subtreeHeight: selfSubtreeHeight, subtreeWidth: selfSubtreeWidth };
}


export function calculateLayout(rootDataNode: MindMapNodeData): LayoutData {
  const laidOutNodes: LaidOutMindMapNode[] = [];
  const connections: Connection[] = [];
  let canvasWidth = 0;
  let canvasHeight = 0;

  const layoutResult = layoutNodeRecursive(rootDataNode, 50, 50, null); // Initial position for root
  const laidOutRoot = layoutResult.node;

  // Flatten tree and create connections
  function flattenAndConnect(node: LaidOutMindMapNode) {
    laidOutNodes.push(node);
    canvasWidth = Math.max(canvasWidth, node.x + node.width);
    canvasHeight = Math.max(canvasHeight, node.y + node.height);

    for (const child of node.children) {
      const parentExitPoint: Position = { x: node.x + node.width, y: node.y + node.height / 2 };
      const childEntrypoint: Position = { x: child.x, y: child.y + child.height / 2 };
      
      connections.push({
        from: parentExitPoint,
        to: childEntrypoint,
        id: `${node.id}-${child.id}`,
        sourceId: node.id,
        targetId: child.id,
      });
      flattenAndConnect(child);
    }
  }

  flattenAndConnect(laidOutRoot);

  // Add some padding to canvas dimensions
  canvasWidth += 50;
  canvasHeight += 50;

  // Normalize coordinates if they are negative (e.g. if root moved up significantly)
  const minX = Math.min(...laidOutNodes.map(n => n.x), Infinity);
  const minY = Math.min(...laidOutNodes.map(n => n.y), Infinity);

  if (minX < 0 || minY < 0) {
    const shiftX = minX < 50 ? -minX + 50 : 0; // Ensure minX is at least 50
    const shiftY = minY < 50 ? -minY + 50 : 0; // Ensure minY is at least 50


    if (shiftX > 0 || shiftY > 0) {
        laidOutNodes.forEach(node => {
        node.x += shiftX;
        node.y += shiftY;
        });
        connections.forEach(conn => {
        conn.from.x += shiftX;
        conn.from.y += shiftY;
        conn.to.x += shiftX;
        conn.to.y += shiftY;
        });
        // Recalculate canvasWidth and canvasHeight based on shifted nodes
        canvasWidth = Math.max(...laidOutNodes.map(n => n.x + n.width), 0) + 50;
        canvasHeight = Math.max(...laidOutNodes.map(n => n.y + n.height), 0) + 50;
    }
  }


  return { nodes: laidOutNodes, connections, canvasWidth, canvasHeight };
}
