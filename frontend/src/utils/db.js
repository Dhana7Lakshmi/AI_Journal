/**
 * LifeReel AI - Memory Database Utility (localStorage wrapper)
 */
export class MemoryStore {
  constructor() {
    this.key = 'lifereel_memories_v2';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.key)) {
      // Start database empty as requested
      localStorage.setItem(this.key, JSON.stringify([]));
    }
  }

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || [];
    } catch (e) {
      console.error('Failed to parse memories from localStorage', e);
      return [];
    }
  }

  save(memory) {
    const memories = this.getAll();
    const entry = {
      id: memory.id || String(Date.now()),
      title: memory.title || 'Untitled Memory',
      mood: memory.mood || 'Calm',
      date: memory.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      image: memory.image || null,
      narrative: memory.narrative || '',
      duration: memory.duration || 0,
      timestamp: memory.timestamp || Date.now(),
      isFavorite: !!memory.isFavorite,
      hasImage: !!memory.hasImage,
      transcript: memory.transcript || '',
      stability: memory.stability || 84
    };
    memories.unshift(entry);
    localStorage.setItem(this.key, JSON.stringify(memories));
    return entry;
  }

  delete(id) {
    let memories = this.getAll();
    memories = memories.filter(m => m.id !== id);
    localStorage.setItem(this.key, JSON.stringify(memories));
    return memories;
  }

  toggleFavorite(id) {
    const memories = this.getAll();
    const index = memories.findIndex(m => m.id === id);
    if (index !== -1) {
      memories[index].isFavorite = !memories[index].isFavorite;
      localStorage.setItem(this.key, JSON.stringify(memories));
    }
    return memories;
  }

  clearAll() {
    localStorage.removeItem(this.key);
    this.init();
    return this.getAll();
  }
}

export const db = new MemoryStore();
