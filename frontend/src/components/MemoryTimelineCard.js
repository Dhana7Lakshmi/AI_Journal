/**
 * LifeReel AI - Memory Timeline Card Component
 * Renders the full details of a memory: single illustration image,
 * story, characters, emotion badge, and collapsible transcript accordion.
 * Video player is intentionally removed (simplified pipeline).
 */

export class MemoryTimelineCard {
  render(memory) {
    const card = document.createElement('div');
    card.className = 'glass-card timeline-card-wrapper';
    card.style.margin = '2rem auto';
    card.style.maxWidth = '850px';
    card.style.width = '100%';
    card.style.padding = '2.2rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '1.8rem';
    card.style.borderRadius = '24px';
    card.style.boxShadow = 'var(--glass-shadow)';

    const backendUrl = 'http://localhost:8000';

    // Resolve emotion from unified schema (emotion) or legacy (dominant_emotion)
    const emotion = memory.emotion || memory.dominant_emotion || 'Calm';
    const lowerEmotion = emotion.toLowerCase();

    // Resolve story from unified schema (story) or legacy (narrative)
    const story = memory.story || memory.narrative || '';

    // Resolve image URL
    const photos = memory.photos || [];
    const rawImageUrl = photos.length > 0 ? photos[0] : (memory.image_url || memory.image || '');
    const imageUrl = rawImageUrl
      ? (rawImageUrl.startsWith('http') ? rawImageUrl : `${backendUrl}${rawImageUrl}`)
      : '';

    // Resolve characters array
    const characters = Array.isArray(memory.characters) ? memory.characters : [];

    // Resolve created_at from unified schema or legacy timestamp
    const dateStr = memory.created_at
      ? new Date(memory.created_at).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: '2-digit'
        })
      : (memory.date_string || memory.date || '');

    // Build single illustration media block
    let mediaHtml = '';
    if (imageUrl) {
      mediaHtml = `
        <div class="timeline-media-section" style="border-radius: 18px; border: 1px solid var(--border-glow); overflow: hidden; position: relative; max-height: 420px;">
          <img
            src="${imageUrl}"
            alt="Memory Illustration"
            style="width: 100%; display: block; max-height: 420px; object-fit: cover; border-radius: 18px;"
            onerror="this.parentElement.style.display='none'"
          />
        </div>
      `;
    }

    // Build characters tags HTML
    let charactersHtml = '';
    if (characters.length > 0) {
      const tags = characters.map(c =>
        `<span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; border-radius: 20px; background: rgba(255, 141, 161, 0.1); border: 1px solid rgba(255, 141, 161, 0.25); color: #ff8da1; font-size: 0.82rem; font-weight: 600;">
          <i class="bi bi-person-fill"></i>${c}
        </span>`
      ).join('');
      charactersHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          <h4 style="font-family: var(--font-sans); font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.6); margin: 0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.8rem;">People in this Memory</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">${tags}</div>
        </div>
      `;
    }

    card.innerHTML = `
      <!-- Single Illustration Image -->
      ${mediaHtml}

      <!-- Header row: title, date, emotion badge -->
      <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <h3 style="font-family: var(--font-sans); font-size: 1.6rem; font-weight: 700; margin: 0; color: var(--text-primary); letter-spacing: -0.5px;">${memory.title || 'Untitled Memory'}</h3>
          <span class="emotion-badge ${lowerEmotion}">${emotion}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0; font-family: var(--font-tech); text-transform: uppercase; letter-spacing: 0.5px;">${dateStr}</p>
      </div>

      <!-- Story / Narrative block -->
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        <h4 style="font-family: var(--font-sans); font-size: 1.15rem; font-weight: 600; color: #ff8da1; margin: 0;">Memory Story</h4>
        <p style="line-height: 1.7; color: var(--text-secondary); margin: 0; font-size: 1.05rem;">${story}</p>
      </div>

      <!-- Signature Quote -->
      ${memory.signature_quote ? `
      <div style="border-left: 3px solid #ff8da1; padding-left: 1rem; margin: 0.5rem 0; font-style: italic; color: var(--text-secondary); font-size: 1.02rem; font-family: var(--font-serif); line-height: 1.5;">
        "${memory.signature_quote}"
      </div>
      ` : ''}

      <!-- Characters -->
      ${charactersHtml}

      <!-- Collapsible Transcript Accordion -->
      <div style="border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; overflow: hidden; background: rgba(0, 0, 0, 0.12);">
        <div class="transcript-accordion-header" id="accordion-trigger" style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; cursor: pointer; user-select: none; transition: background 0.3s ease;">
          <span style="font-family: var(--font-tech); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-primary);">Vocal Transcript</span>
          <i class="bi bi-chevron-down" style="transition: transform 0.3s ease; color: var(--text-secondary);"></i>
        </div>
        <div class="transcript-accordion-content" id="accordion-content" style="max-height: 0; overflow: hidden; transition: max-height 0.45s cubic-bezier(0.175, 0.885, 0.32, 1); background: rgba(0, 0, 0, 0.15);">
          <p class="transcript-inner-text" style="padding: 1.5rem; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; margin: 0;">${memory.transcript || 'No transcript available.'}</p>
        </div>
      </div>
    `;

    // Bind accordion expand/collapse
    const accordionHeader = card.querySelector('#accordion-trigger');
    const accordionContent = card.querySelector('#accordion-content');
    const chevronIcon = accordionHeader.querySelector('i');

    accordionHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = accordionContent.classList.toggle('open');
      if (isOpen) {
        accordionContent.style.maxHeight = `${accordionContent.scrollHeight}px`;
        chevronIcon.style.transform = 'rotate(180deg)';
      } else {
        accordionContent.style.maxHeight = '0';
        chevronIcon.style.transform = 'rotate(0deg)';
      }
    });

    // Click handler to open the full memory details page
    card.addEventListener('click', () => {
      if (!window.location.hash.startsWith('#details')) {
        window.location.hash = `#details?id=${memory.id || memory._id}`;
      }
    });

    return card;
  }
}
