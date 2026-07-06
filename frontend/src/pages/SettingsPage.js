/**
 * LifeReel AI - SettingsPage View
 * Simplified for cute light theme settings with layout-stable inline confirmations.
 */
import { auth } from '../utils/auth.js';
import { db } from '../utils/db.js';
import { synth } from '../utils/synth.js';

export class SettingsPage {
  render() {
    const container = document.createElement('div');
    container.className = 'page-view settings-container';

    const user = auth.getCurrentUser();
    if (!user) {
      setTimeout(() => { window.location.hash = '#login'; }, 50);
      return container;
    }

    container.innerHTML = `
      <div class="section-title-wrap" style="text-align: left; margin-bottom: 2rem;">
        <h2 class="section-title">Settings</h2>
        <p class="section-subtitle">Back up your data, export memories, or delete your diary database.</p>
      </div>

      <div class="settings-card">
        <h3>Database Management</h3>
        <div class="settings-options-list">
          <!-- Option 1: Export -->
          <div class="settings-row">
            <div class="settings-label">
              <h4>Export Memories</h4>
              <p>Save all your journal entries and voice recordings to a JSON file.</p>
            </div>
            <button class="btn-settings-action" id="btn-export-json">
              <i class="bi bi-download" style="margin-right: 0.5rem;"></i>Export JSON
            </button>
          </div>

          <!-- Option 2: Purge -->
          <div class="settings-row" style="border-top: 1px solid var(--border-glow); padding-top: 1.5rem;">
            <div class="settings-label">
              <h4>Delete Diary Database</h4>
              <p style="color: #ff5572;"><i class="bi bi-exclamation-triangle" style="margin-right: 0.5rem;"></i>Warning: This permanently deletes all your journal entries.</p>
            </div>
            <button class="btn-settings-danger" id="btn-purge-db">
              <i class="bi bi-exclamation-circle-fill" id="purge-icon" style="margin-right: 0.5rem; display: none;"></i>
              <span id="purge-btn-text">Delete All Memories</span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Account Operations</h3>
        <div class="settings-options-list">
          <div class="settings-row">
            <div class="settings-label">
              <h4>Session Management</h4>
              <p>Log out of your account.</p>
            </div>
            <button class="btn-settings-danger" id="btn-logout-action" style="border-color: #ff8da1; color: #ff8da1; min-width: 200px;">
              <i class="bi bi-box-arrow-right" id="logout-icon" style="margin-right: 0.5rem;"></i>
              <span id="logout-btn-text">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Elements
    const exportBtn = container.querySelector('#btn-export-json');
    const purgeBtn = container.querySelector('#btn-purge-db');
    const purgeBtnText = container.querySelector('#purge-btn-text');
    const purgeIcon = container.querySelector('#purge-icon');
    const logoutBtn = container.querySelector('#btn-logout-action');
    const logoutBtnText = container.querySelector('#logout-btn-text');
    const logoutIcon = container.querySelector('#logout-icon');

    // Export JSON data
    exportBtn.addEventListener('click', () => {
      synth.playClick();
      const memories = db.getAll();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lifereel_vault_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Custom inline confirmation states
    let purgeConfirmState = false;
    let purgeTimeout = null;

    purgeBtn.addEventListener('click', () => {
      synth.playClick();
      if (!purgeConfirmState) {
        purgeConfirmState = true;
        purgeBtnText.textContent = 'Confirm Delete?';
        purgeIcon.style.display = 'inline-block';
        purgeBtn.style.background = '#ff5572';
        purgeBtn.style.color = '#FFFFFF';
        
        purgeTimeout = setTimeout(() => {
          purgeConfirmState = false;
          purgeBtnText.textContent = 'Delete All Memories';
          purgeIcon.style.display = 'none';
          purgeBtn.style.background = 'transparent';
          purgeBtn.style.color = '#ff5572';
        }, 3000);
      } else {
        clearTimeout(purgeTimeout);
        purgeConfirmState = false;
        purgeBtnText.textContent = 'Delete All Memories';
        purgeIcon.style.display = 'none';
        purgeBtn.style.background = 'transparent';
        purgeBtn.style.color = '#ff5572';
        
        db.clearAll();
        synth.playConfirmChime();
        alert('Diary database deleted.');
        window.location.hash = '#timeline';
      }
    });

    let logoutConfirmState = false;
    let logoutTimeout = null;

    logoutBtn.addEventListener('click', () => {
      synth.playClick();
      if (!logoutConfirmState) {
        logoutConfirmState = true;
        logoutBtnText.textContent = 'Confirm Log Out?';
        logoutIcon.className = 'bi bi-question-circle-fill';
        logoutBtn.style.background = '#ff5500';
        logoutBtn.style.color = '#FFFFFF';
        logoutBtn.style.borderColor = '#ff5500';
        
        logoutTimeout = setTimeout(() => {
          logoutConfirmState = false;
          logoutBtnText.textContent = 'Log Out';
          logoutIcon.className = 'bi bi-box-arrow-right';
          logoutBtn.style.background = 'transparent';
          logoutBtn.style.color = '#ff8da1';
          logoutBtn.style.borderColor = '#ff8da1';
        }, 3000);
      } else {
        clearTimeout(logoutTimeout);
        logoutConfirmState = false;
        logoutBtnText.textContent = 'Log Out';
        logoutIcon.className = 'bi bi-box-arrow-right';
        logoutBtn.style.background = 'transparent';
        logoutBtn.style.color = '#ff8da1';
        logoutBtn.style.borderColor = '#ff8da1';
        
        auth.logout();
        window.dispatchEvent(new CustomEvent('auth-change'));
        window.location.hash = '#home';
      }
    });

    return container;
  }

  onMount() {}
}
