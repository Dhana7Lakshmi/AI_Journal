/**
 * LifeReel AI - Footer Component
 */

export class Footer {
  render() {
    const footer = document.createElement('footer');
    footer.className = 'footer-wrap';
    
    footer.innerHTML = `
      <div class="footer-logo">
        <i class="bi bi-cpu" style="color: var(--color-orange); margin-right: 0.5rem;"></i>
        <span>LifeReel AI</span>
      </div>
      <div>
        <p>&copy; 2026 LifeReel AI. Futuristic Memory Vault.</p>
      </div>
      <ul class="footer-links">
        <li><a href="#about">About</a></li>
        <li><a href="#terms">Terms of Sync</a></li>
        <li><a href="#privacy">Privacy Protocol</a></li>
      </ul>
    `;
    return footer;
  }
}
export const footer = new Footer();
