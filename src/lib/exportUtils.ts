import type { MindMap, MindMapNodeData } from '@/types/mindmap';

function convertNodeToMarkdown(node: MindMapNodeData, depth: number): string {
  let markdown = '';
  const prefix = '  '.repeat(Math.max(0, depth - 1)); // Indentation starts from depth 1

  if (depth === 0) {
    markdown += `# ${node.text}\n\n`;
  } else if (depth === 1) {
    markdown += `## ${node.text}\n\n`;
  } else {
    markdown += `${prefix}- ${node.text}\n`;
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      markdown += convertNodeToMarkdown(child, depth + 1);
    }
    if (depth > 0) {
      markdown += '\n'; // Add a newline after a block of children for readability
    }
  }

  return markdown;
}

export function exportToMarkdown(mindMap: MindMap): string {
  if (!mindMap || !mindMap.root) {
    return '';
  }
  return convertNodeToMarkdown(mindMap.root, 0);
}

    