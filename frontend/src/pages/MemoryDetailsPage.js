/**
 * LifeReel AI - Memory Details Page
 * Fetches memory data from the FastAPI backend and renders it using MemoryTimelineCard.
 */
import { intelApi, normalizeMood } from '../api/api.js';
import { db } from '../utils/db.js';
import { synth } from '../utils/synth.js';
import { MemoryCard } from '../components/MemoryCard.js';
import { MemoryTimelineCard } from '../components/MemoryTimelineCard.js';

export class MemoryDetailsPage {
  constructor() {
    this.memory = null;
    this.related = [];
    this.container = null;
    this.memoryId = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'page-view';

    // Parse id from hash query
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
    this.memoryId = urlParams.get('id');

    if (!this.memoryId) {
      setTimeout(() => { window.location.hash = '#timeline'; }, 50);
      return this.container;
    }

    // Return loading placeholder initially
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 1rem; color: var(--text-secondary);">
        <div class="spinner-ring" style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.05); border-top-color: #ff8da1; animation: spin 1s linear infinite;"></div>
        <p style="font-family: var(--font-tech); font-size: 0.9rem;">Sculpting memory details...</p>
      </div>
    `;

    return this.container;
  }

  async onMount() {
    if (!this.memoryId) return;

    try {
      // Fetch details and timeline concurrently
      const [memoryData, timelineData] = await Promise.all([
        intelApi.getEntry(this.memoryId),
        intelApi.getTimeline().catch(() => []) // fallback if timeline fails
      ]);

      this.memory = memoryData;

      // Filter related memories (same emotion, up to 2 items, excluding current)
      const currentMood = normalizeMood(this.memory.emotion || this.memory.dominant_emotion || this.memory.mood);
      this.related = timelineData
        .filter(m => {
          const mMood = normalizeMood(m.emotion || m.dominant_emotion || m.mood);
          return mMood.toLowerCase() === currentMood.toLowerCase() && m.id !== this.memory.id;
        })
        .slice(0, 2);

      this.renderDetails();
    } catch (err) {
      console.error("Failed to load memory details:", err);
      this.container.innerHTML = `
        <div class="empty-timeline-msg" style="color: #ff5572; border-color: rgba(255, 85, 114, 0.15);">
          <h3>Failed to Load Memory</h3>
          <p>${err.message || 'The memory could not be retrieved from the database.'}</p>
          <a href="#timeline" class="btn-hero-timeline" style="display: inline-flex; margin-top: 1.5rem; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 10px; background: rgba(255, 255, 255, 0.05); color: #fff;">Back to Timeline</a>
        </div>
      `;
    }
  }

  renderDetails() {
    // Generate the core details card using MemoryTimelineCard
    const cardComponent = new MemoryTimelineCard();
    const cardNode = cardComponent.render(this.memory);

    // Build related section HTML
    let relatedHtml = '';
    if (this.related.length > 0) {
      relatedHtml = `
        <div style="margin-top: 4rem; border-top: 1px solid var(--border-glow); padding-top: 3rem; max-width: 850px; margin-left: auto; margin-right: auto; width: 100%;">
          <h4 style="font-family: var(--font-sans); font-size: 1.35rem; margin-bottom: 2rem; color: #ff8da1; text-align: left; font-weight: 700;">Related Memories</h4>
          <div class="timeline-grid" id="related-cards-hook" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
            <!-- Related cards will be appended here -->
          </div>
        </div>
      `;
    }

    // Build actions bar
    // Build photo gallery section if photos exist
    let galleryHtml = '';
    const backendUrl = 'http://localhost:8000';
    const photos = this.memory.photos || [];
    if (photos.length > 0) {
      const imgTags = photos.map(p => {
        const pUrl = p.startsWith('http') ? p : `${backendUrl}${p}`;
        return `<div class="gallery-photo-item" style="border-radius: 16px; border: 1px solid var(--border-glow); overflow: hidden; position: relative; box-shadow: var(--glass-shadow); aspect-ratio: 4/3;">
          <img src="${pUrl}" alt="Uploaded photo" style="width: 100%; height: 100%; display: block; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" />
        </div>`;
      }).join('');
      galleryHtml = `
        <div style="margin-top: 3rem; max-width: 850px; margin-left: auto; margin-right: auto; width: 100%;">
          <h4 style="font-family: var(--font-sans); font-size: 1.15rem; margin-bottom: 1.5rem; color: #ff8da1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-images"></i> Authentic Memory Gallery
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem;">
            ${imgTags}
          </div>
        </div>
      `;
    }

    const isFav = db.getAll().some(m => m.id === this.memory.id && m.isFavorite);

    this.container.innerHTML = `
      <div style="margin-bottom: 2rem; max-width: 850px; margin-left: auto; margin-right: auto; width: 100%; display: flex; justify-content: space-between; align-items: center;">
        <a href="#timeline" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--text-secondary)'">
          <i class="bi bi-chevron-left"></i>
          <span>Return to Timeline</span>
        </a>
      </div>

      <div id="details-core-hook"></div>

      <!-- Photo Gallery -->
      ${galleryHtml}

      <!-- Action buttons -->
      <div style="max-width: 850px; margin: 1.5rem auto; width: 100%; display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="btn-details-action ${isFav ? 'favorite-active' : ''}" id="details-btn-fav" style="min-width: 180px; padding: 0.75rem 1.5rem; border-radius: 12px; background: ${isFav ? 'rgba(255, 209, 169, 0.15)' : 'rgba(255, 255, 255, 0.03)'}; border: 1px solid ${isFav ? 'var(--mood-nostalgic)' : 'rgba(255, 255, 255, 0.08)'}; color: ${isFav ? 'var(--mood-nostalgic)' : '#ffffff'}; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s;">
          <i class="bi ${isFav ? 'bi-star-fill' : 'bi-star'}"></i>
          <span>${isFav ? 'Bookmarked' : 'Bookmark Entry'}</span>
        </button>
        <button class="btn-details-action btn-delete" id="details-btn-delete" style="color: #ff5572; border: 1px solid rgba(255, 85, 114, 0.25); background: rgba(255, 85, 114, 0.03); min-width: 160px; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s;">
          <i class="bi bi-trash"></i>
          <span>Delete Entry</span>
        </button>
      </div>

      ${relatedHtml}
    `;

    // Mount core card
    this.container.querySelector('#details-core-hook').appendChild(cardNode);

    // Bind Favorite event listener
    const favBtn = this.container.querySelector('#details-btn-fav');
    favBtn.addEventListener('click', () => {
      synth.playClick();
      // Sync local favorite store
      const allFavs = db.getAll();
      const existing = allFavs.find(m => m.id === this.memory.id);
      if (existing) {
        db.toggleFavorite(this.memory.id);
      } else {
        // save a shell reference locally to bookmark it
        db.save({
          id: this.memory.id,
          title: this.memory.title,
          mood: normalizeMood(this.memory.emotion || this.memory.dominant_emotion || this.memory.mood),
          isFavorite: true,
          narrative: this.memory.story || this.memory.narrative
        });
      }
      
      const updatedFav = db.getAll().some(m => m.id === this.memory.id && m.isFavorite);
      favBtn.classList.toggle('favorite-active', updatedFav);
      favBtn.style.background = updatedFav ? 'rgba(255, 209, 169, 0.15)' : 'rgba(255, 255, 255, 0.03)';
      favBtn.style.borderColor = updatedFav ? 'var(--mood-nostalgic)' : 'rgba(255, 255, 255, 0.08)';
      favBtn.style.color = updatedFav ? 'var(--mood-nostalgic)' : '#ffffff';
      favBtn.querySelector('i').className = updatedFav ? 'bi bi-star-fill' : 'bi bi-star';
      favBtn.querySelector('span').textContent = updatedFav ? 'Bookmarked' : 'Bookmark Entry';
    });

    // Bind Delete event listener
    const deleteBtn = this.container.querySelector('#details-btn-delete');
    let deleteConfirmState = false;
    let deleteTimeout = null;

    deleteBtn.addEventListener('click', async () => {
      synth.playClick();
      if (!deleteConfirmState) {
        deleteConfirmState = true;
        deleteBtn.querySelector('span').textContent = 'Confirm Delete?';
        deleteBtn.querySelector('i').className = 'bi bi-question-circle-fill';
        deleteBtn.style.background = '#ff5572';
        deleteBtn.style.color = '#FFFFFF';
        deleteBtn.style.borderColor = '#ff5572';
        
        deleteTimeout = setTimeout(() => {
          deleteConfirmState = false;
          deleteBtn.querySelector('span').textContent = 'Delete Entry';
          deleteBtn.querySelector('i').className = 'bi bi-trash';
          deleteBtn.style.background = 'rgba(255, 85, 114, 0.03)';
          deleteBtn.style.color = '#ff5572';
          deleteBtn.style.borderColor = 'rgba(255, 85, 114, 0.25)';
        }, 3000);
      } else {
        clearTimeout(deleteTimeout);
        try {
          deleteBtn.disabled = true;
          deleteBtn.querySelector('span').textContent = 'Deleting...';
          
          await intelApi.deleteEntry(this.memory.id);
          db.delete(this.memory.id); // Sync clean local bookmark if any
          
          window.location.hash = '#timeline';
        } catch (err) {
          console.error("Failed to delete entry:", err);
          alert("Failed to delete memory: " + err.message);
          deleteConfirmState = false;
          deleteBtn.disabled = false;
          deleteBtn.querySelector('span').textContent = 'Delete Entry';
          deleteBtn.querySelector('i').className = 'bi bi-trash';
          deleteBtn.style.background = 'rgba(255, 85, 114, 0.03)';
          deleteBtn.style.color = '#ff5572';
          deleteBtn.style.borderColor = 'rgba(255, 85, 114, 0.25)';
        }
      }
    });

    // Append related cards
    const relatedHook = this.container.querySelector('#related-cards-hook');
    if (relatedHook) {
      const cardFactory = new MemoryCard();
      this.related.forEach(rel => {
        const c = cardFactory.render(rel);
        relatedHook.appendChild(c);
      });
    }
  }

  destroy() {
    // stop video or media playing if any
    const video = this.container.querySelector('video');
    if (video) {
      video.pause();
    }
  }
}
