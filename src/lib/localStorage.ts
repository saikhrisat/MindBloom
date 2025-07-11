import type { MindMap } from '@/types/mindmap';
import { v4 as uuidv4 } from 'uuid';

const MINDMAP_COLLECTION_KEY = 'mindbloom-collection';
const ACTIVE_MINDMAP_ID_KEY = 'mindbloom-active-id';

export function loadMindMapCollection(): MindMap[] {
  if (typeof window !== 'undefined') {
    try {
      const serializedCollection = localStorage.getItem(MINDMAP_COLLECTION_KEY);
      if (serializedCollection === null) {
        return [];
      }
      const collection = JSON.parse(serializedCollection) as MindMap[];
      // Ensure all maps have an id, title, and lastModified
      return collection.map(m => ({
        ...m,
        id: m.id || uuidv4(),
        title: m.title || 'Untitled Mind Map',
        lastModified: m.lastModified || Date.now(),
        root: m.root || { id: uuidv4(), text: 'Central Idea', children: [] }
      })).sort((a, b) => b.lastModified - a.lastModified); // Sort by most recently modified
    } catch (error) {
      console.error("Failed to load mind map collection from local storage:", error);
      return [];
    }
  }
  return [];
}

export function saveMindMapCollection(collection: MindMap[]): void {
  if (typeof window !== 'undefined') {
    try {
      const serializedCollection = JSON.stringify(collection);
      localStorage.setItem(MINDMAP_COLLECTION_KEY, serializedCollection);
    } catch (error) {
      console.error("Failed to save mind map collection to local storage:", error);
    }
  }
}

export function saveMindMapToCollection(mindMapToSave: MindMap): MindMap[] {
  let collection = loadMindMapCollection();
  const existingMapIndex = collection.findIndex(m => m.id === mindMapToSave.id);

  const mapWithTimestamp = { ...mindMapToSave, lastModified: Date.now() };

  if (existingMapIndex > -1) {
    collection[existingMapIndex] = mapWithTimestamp;
  } else {
    collection.push(mapWithTimestamp);
  }
  // Sort by most recently modified after saving
  collection.sort((a, b) => b.lastModified - a.lastModified);
  saveMindMapCollection(collection);
  return collection;
}

export function deleteMindMapFromCollectionById(mapId: string): MindMap[] {
  let collection = loadMindMapCollection();
  const updatedCollection = collection.filter(m => m.id !== mapId);
  saveMindMapCollection(updatedCollection);
  if (getStoredActiveMindMapId() === mapId) {
    setStoredActiveMindMapId(null); // Clear active ID if deleted map was active
  }
  return updatedCollection;
}

export function getStoredActiveMindMapId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACTIVE_MINDMAP_ID_KEY);
  }
  return null;
}

export function setStoredActiveMindMapId(mapId: string | null): void {
  if (typeof window !== 'undefined') {
    if (mapId) {
      localStorage.setItem(ACTIVE_MINDMAP_ID_KEY, mapId);
    } else {
      localStorage.removeItem(ACTIVE_MINDMAP_ID_KEY);
    }
  }
}
