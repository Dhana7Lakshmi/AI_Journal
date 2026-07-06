/**
 * LifeReel AI - TimelinePage (Memory Index Directory) View
 * Loads memories from the backend database and displays them.
 */
import { intelApi, normalizeMood } from '../api/api.js';
import { MemoryCard } from '../components/MemoryCard.js';
import { MemoryTimelineCard } from '../components/MemoryTimelineCard.js';

export class TimelinePage {
  constructor() {
    this.currentMoodFilter = 'all';
    this.searchQuery = '';
    this.gridEl = null;
    this.memories = [];
  }

  render() {
    const container = document.createElement('div');
    container.className = 'page-view';

    container.innerHTML = `
      <div class="timeline-header-controls">
        <div class="timeline-search-row">
          <div class="timeline-title-wrap">
            <h2 class="section-title" style="text-align: left; margin: 0;">My Memory Timeline</h2>
            <p class="section-subtitle">Scroll through your recorded memories, from newest to oldest.</p>
          </div>
          
          <div class="search-input-wrapper">
            <i class="bi bi-search"></i>
            <input type="text" class="timeline-search-input" id="search-box" placeholder="Search my journal entries...">
          </div>
        </div>

        <!-- Filter tags -->
        <div class="mood-filters-wrap" id="filters-container">
          <button class="mood-filter-chip ${this.currentMoodFilter === 'all' ? 'active' : ''}" data-mood="all">
            <span>All Memories</span>
          </button>
          <button class="mood-filter-chip ${this.currentMoodFilter === 'Calm' ? 'active' : ''}" data-mood="Calm">
            <span class="mood-dot calm"></span>
            <span>Calm</span>
          </button>
          <button class="mood-filter-chip ${this.currentMoodFilter === 'Nostalgic' ? 'active' : ''}" data-mood="Nostalgic">
            <span class="mood-dot nostalgic"></span>
            <span>Nostalgic</span>
          </button>
          <button class="mood-filter-chip ${this.currentMoodFilter === 'Inspired' ? 'active' : ''}" data-mood="Inspired">
            <span class="mood-dot inspired"></span>
            <span>Inspired</span>
          </button>
          <button class="mood-filter-chip ${this.currentMoodFilter === 'Grateful' ? 'active' : ''}" data-mood="Grateful">
            <span class="mood-dot grateful"></span>
            <span>Grateful</span>
          </button>
          <button class="mood-filter-chip ${this.currentMoodFilter === 'Joyful' ? 'active' : ''}" data-mood="Joyful">
            <span class="mood-dot joyful"></span>
            <span>Joyful</span>
          </button>
        </div>
      </div>

      <!-- Polaroid Masonry Columns Grid -->
      <div class="timeline-grid" id="grid-mount"></div>
    `;

    // Elements
    const searchBox = container.querySelector('#search-box');
    const filters = container.querySelector('#filters-container');
    this.gridEl = container.querySelector('#grid-mount');

    searchBox.value = this.searchQuery;

    // Search input listener
    searchBox.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.refreshGrid();
    });

    // Filter chips listener
    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('.mood-filter-chip');
      if (!chip) return;

      filters.querySelectorAll('.mood-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      this.currentMoodFilter = chip.dataset.mood;
      this.refreshGrid();
    });

    return container;
  }

  async onMount() {
    await this.loadMemories();
  }

  async loadMemories() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 4rem 0; gap: 1rem; color: var(--text-secondary);">
        <div class="spinner-ring" style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.05); border-top-color: #ff8da1; animation: spin 1s linear infinite;"></div>
        <p style="font-family: var(--font-tech); font-size: 0.9rem;">Retrieving your timeline entries...</p>
      </div>
    `;

    try {
      this.memories = await intelApi.getTimeline();
      this.refreshGrid();
    } catch (err) {
      console.error("Failed to load timeline:", err);
      this.gridEl.innerHTML = `
        <div class="empty-timeline-msg" style="color: #ff5572; border-color: rgba(255, 85, 114, 0.15);">
          <i class="bi bi-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
          Failed to load timeline. Please ensure the backend server is running.
        </div>
      `;
    }
  }

  refreshGrid() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';

    const filtered = this.memories.filter(item => {
      // Mood/emotion filter – supports both unified schema and legacy
      const emotionVal = normalizeMood(item.emotion || item.dominant_emotion || item.mood);
      if (this.currentMoodFilter !== 'all' && emotionVal.toLowerCase() !== this.currentMoodFilter.toLowerCase()) {
        return false;
      }
      // Search – supports both unified schema (story) and legacy (narrative)
      const storyText = item.story || item.narrative || '';
      const dateText = item.created_at
        ? new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' })
        : (item.date_string || item.date || '');
      const textToSearch = `${item.title} ${storyText} ${emotionVal} ${dateText}`.toLowerCase();
      if (this.searchQuery) {
        return textToSearch.includes(this.searchQuery);
      }
      return true;
    });

    if (filtered.length === 0) {
      this.gridEl.innerHTML = `
        <div class="empty-timeline-msg">
          No memories found. Start by writing or recording a new memory!
        </div>
      `;
      return;
    }

    filtered.forEach(memory => {
      let cardEl;
      // Use MemoryTimelineCard for entries with any image (photos or illustration), MemoryCard for text-only
      const hasImage = (memory.photos && memory.photos.length > 0) || memory.image_url || memory.image;
      if (hasImage) {
        cardEl = new MemoryTimelineCard().render(memory);
      } else {
        cardEl = new MemoryCard().render(memory);
      }
      this.gridEl.appendChild(cardEl);
    });
  }
}
