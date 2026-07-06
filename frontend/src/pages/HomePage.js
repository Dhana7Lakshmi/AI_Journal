/**
 * LifeReel AI - HomePage (Landing View)
 * Clean landing layout with simple, understandable language.
 */
import { auth } from '../utils/auth.js';
import { Footer } from '../components/Footer.js';

export class HomePage {
  render() {
    const user = auth.getCurrentUser();
    const ctaHash = user ? '#record' : '#signup';

    const container = document.createElement('div');
    container.className = 'page-view';
    container.style.maxWidth = '100%';
    container.style.padding = '0';

    container.innerHTML = `
      <section class="hero-section" style="padding-bottom: 3rem;">
        <span class="hero-tag">Your Personal Memory Diary</span>
        <h1 class="hero-title">Save your memories <span>before they fade.</span></h1>
        <p class="hero-subtitle">LifeReel AI is a cozy, cute digital memory diary. AI-assisted memory preservation platform. Record your voice, write down your thoughts, track your mood, and save memories with optional cute illustrations.</p>
        
        <div class="hero-cta-container">
          <a href="${ctaHash}" class="btn-hero-record">
            <i class="bi bi-mic-fill"></i>
            <span>Record Today's Memory</span>
          </a>
          <a href="${user ? '#timeline' : '#login'}" class="btn-hero-timeline">
            <i class="bi bi-archive"></i>
            <span>Open Vault Timeline</span>
          </a>
        </div>
      </section>

      <div class="glass-card home-features-section">
        <h2 class="section-title">Cozy Vault Features</h2>
        <p class="section-subtitle">How LifeReel AI helps you keep track of your days.</p>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrapper"><i class="bi bi-soundwave"></i></div>
            <h3>Voice Memories</h3>
            <p>Record your voice and convert it to written memory text files instantly.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper"><i class="bi bi-quote"></i></div>
            <h3>Memory Stories</h3>
            <p>Let our AI assistant help write your raw spoken thoughts into beautiful diary entries.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper"><i class="bi bi-activity"></i></div>
            <h3>Mood Analytics</h3>
            <p>Track your mood over time and understand your emotional trends in a simple chart.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper"><i class="bi bi-image"></i></div>
            <h3>Memory Illustration</h3>
            <p>Optionally generate cute digital illustrations to represent your special moments.</p>
          </div>
        </div>
      </div>
    `;

    // Append footer
    const ft = new Footer().render();
    container.appendChild(ft);

    return container;
  }

  onMount() {}
}
