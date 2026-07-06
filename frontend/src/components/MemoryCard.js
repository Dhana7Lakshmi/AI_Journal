/**
 * LifeReel AI - Memory Card (Polaroid compact style) Component
 * Used in the timeline grid and related memory sections.
 * Supports the unified schema: story, emotion, image_url, created_at.
 */
import { MoodTag } from './MoodTag.js';

export class MemoryCard {
  render(memory) {
    // Support both unified schema and legacy field names
    const emotion = memory.emotion || memory.dominant_emotion || memory.mood || 'Calm';
    const story = memory.story || memory.narrative || '';
    const photos = memory.photos || [];
    const imageUrl = photos.length > 0 ? photos[0] : (memory.image_url || memory.image || '');
    const backendUrl = 'http://localhost:8000';
    const resolvedImageUrl = imageUrl
      ? (imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`)
      : '';

    const dateStr = memory.created_at
      ? new Date(memory.created_at).toLocaleDateString('en-US', {
          weekday: 'short', year: 'numeric', month: 'short', day: '2-digit'
        })
      : (memory.date_string || memory.date || '');

    const moodTag = new MoodTag().render(emotion);

    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.dataset.id = memory.id;

    let imageHtml = '';
    if (resolvedImageUrl) {
      imageHtml = `
        <div class="polaroid-image-container" style="width: 100%; height: 200px; border-radius: 14px; overflow: hidden; margin-bottom: 1rem; border: 1px solid rgba(255, 141, 161, 0.15); position: relative;">
          <img
            src="${resolvedImageUrl}"
            alt="${memory.title || 'Memory'}"
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.parentElement.style.display='none'"
          />
        </div>
      `;
    }

    card.innerHTML = `
      ${imageHtml}
      <h3 class="polaroid-title" style="margin-top: 0.5rem; margin-bottom: 0.25rem;">${memory.title || 'Untitled'}</h3>
      <div class="polaroid-info-row" style="margin-top: 0.25rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
        <span>${dateStr}</span>
        <div style="transform: scale(0.9); transform-origin: right;">${moodTag}</div>
      </div>
      <p class="polaroid-preview" style="margin-top: 0.6rem; font-size: 0.92rem; line-height: 1.5;">${story}</p>
    `;

    // Click handler to open the full memory details page
    card.addEventListener('click', () => {
      window.location.hash = `#details?id=${memory.id}`;
    });

    return card;
  }
}
