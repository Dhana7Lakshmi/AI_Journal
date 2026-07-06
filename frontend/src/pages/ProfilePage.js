/**
 * LifeReel AI - ProfilePage View
 */
import { auth } from '../utils/auth.js';
import { db } from '../utils/db.js';
import { MemoryCard } from '../components/MemoryCard.js';

export class ProfilePage {
  render() {
    const container = document.createElement('div');
    container.className = 'page-view profile-container';

    const user = auth.getCurrentUser();
    if (!user) {
      setTimeout(() => { window.location.hash = '#login'; }, 50);
      return container;
    }

    const memories = db.getAll();
    const favMemories = memories.filter(m => m.isFavorite);

    // Calculate dynamic stats
    const totalRecordedSecs = memories.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const avgStability = memories.length > 0 
      ? Math.round(memories.reduce((acc, curr) => acc + (curr.stability || 84), 0) / memories.length)
      : 84;

    container.innerHTML = `
      <div class="profile-card">
        <div class="profile-avatar-wrap">
          <img src="${user.avatar}" alt="${user.username} Avatar">
        </div>
        
        <div class="profile-details">
          <span style="color: var(--color-orange); text-transform: uppercase; font-family: var(--font-tech); font-weight: 700; letter-spacing: 2px; font-size: 0.8rem;">User Profile</span>
          <h2>${user.username}</h2>
          <p style="margin-top: 0.25rem;"><i class="bi bi-envelope" style="margin-right: 0.5rem;"></i>${user.email}</p>
          <p><i class="bi bi-calendar-check" style="margin-right: 0.5rem;"></i>Diary Started: ${user.joinedDate || 'June 1, 2026'}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="profile-stats-grid">
        <div class="stat-item-card">
          <h4>${memories.length}</h4>
          <p>Journal Entries</p>
        </div>
        <div class="stat-item-card">
          <h4>${user.streak || 1}d</h4>
          <p>Journal Streak</p>
        </div>
        <div class="stat-item-card">
          <h4>${totalRecordedSecs}s</h4>
          <p>Audio Recorded</p>
        </div>
        <div class="stat-item-card">
          <h4>${avgStability}%</h4>
          <p>Avg Calmness</p>
        </div>
      </div>

      <!-- Favorites Section -->
      <div style="margin-top: 2rem;">
        <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--color-orange); border-bottom: 1px solid var(--border-glow); padding-bottom: 0.5rem;">
          Favorite Memories
        </h3>
        
        <div class="timeline-grid" id="favorites-grid-mount">
          <!-- Dynamically filled with favorited card components -->
        </div>
      </div>
    `;

    // Mount Favorites
    setTimeout(() => {
      const favGrid = container.querySelector('#favorites-grid-mount');
      if (!favGrid) return;

      if (favMemories.length === 0) {
        favGrid.innerHTML = `
          <div class="empty-timeline-msg" style="grid-column: span 3; width: 100%; text-align: center; padding: 3rem 1rem;">
            No favorite memories bookmarked. Click the star icon inside a journal entry to bookmark it!
          </div>
        `;
        return;
      }

      const cardFactory = new MemoryCard();
      favMemories.forEach(fav => {
        const cardEl = cardFactory.render(fav);
        favGrid.appendChild(cardEl);
      });
    }, 10);

    return container;
  }

  onMount() {}
}
