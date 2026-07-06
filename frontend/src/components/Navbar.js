/**
 * LifeReel AI - Floating Bottom Bubble Tab Bar Component
 */
import { auth } from '../utils/auth.js';

export class Navbar {
  render(activeHash) {
    const user = auth.getCurrentUser();
    const nav = document.createElement('nav');
    nav.className = 'bubble-bottom-nav';

    if (user) {
      // Authenticated Dashboard Navigation Nodes
      nav.innerHTML = `
        <a href="#timeline" class="bubble-nav-link ${activeHash === '#timeline' ? 'active' : ''}" title="Timeline">
          <i class="bi bi-journal-bookmark-fill"></i>
          <span>Timeline</span>
        </a>
        <a href="#analytics" class="bubble-nav-link ${activeHash === '#analytics' ? 'active' : ''}" title="Analytics">
          <i class="bi bi-balloon-fill"></i>
          <span>Analytics</span>
        </a>
        <a href="#capsules" class="bubble-nav-link ${activeHash === '#capsules' ? 'active' : ''}" title="Capsules">
          <i class="bi bi-file-earmark-lock-fill"></i>
          <span>Capsules</span>
        </a>
        
        <!-- Center pop-up microphone recording bubble -->
        <a href="#record" class="bubble-nav-link record-bubble ${activeHash === '#record' ? 'active' : ''}" title="Record Today">
          <i class="bi bi-mic-fill"></i>
        </a>

        <a href="#rewind" class="bubble-nav-link ${activeHash === '#rewind' ? 'active' : ''}" title="Weekly Rewind">
          <i class="bi bi-arrow-repeat"></i>
          <span>Rewind</span>
        </a>
        <a href="#profile" class="bubble-nav-link ${activeHash === '#profile' ? 'active' : ''}" title="Profile">
          <i class="bi bi-person-heart"></i>
          <span>Profile</span>
        </a>
        <a href="#settings" class="bubble-nav-link ${activeHash === '#settings' ? 'active' : ''}" title="Settings">
          <i class="bi bi-gear-fill"></i>
          <span>Settings</span>
        </a>
      `;
    } else {
      // Guest Landing Page Navigation Nodes
      nav.innerHTML = `
        <a href="#home" class="bubble-nav-link ${activeHash === '#home' || !activeHash ? 'active' : ''}" title="Home">
          <i class="bi bi-house-heart-fill"></i>
          <span>Home</span>
        </a>
        <a href="#login" class="bubble-nav-link ${activeHash === '#login' ? 'active' : ''}" title="Log In">
          <i class="bi bi-box-arrow-in-right"></i>
          <span>Log In</span>
        </a>
        <a href="#signup" class="bubble-nav-link ${activeHash === '#signup' ? 'active' : ''}" title="Sign Up">
          <i class="bi bi-heart-fill" style="color: var(--color-orange);"></i>
          <span>Sign Up</span>
        </a>
      `;
    }

    return nav;
  }
}
