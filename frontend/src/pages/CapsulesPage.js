/**
 * LifeReel AI - CapsulesPage View
 * Seal away memories to be opened on a future date.
 */
import { intelApi } from '../api/api.js';
import { AudioRecorder } from '../components/AudioRecorder.js';
import { synth } from '../utils/synth.js';

export class CapsulesPage {
  constructor() {
    this.container = null;
    this.capsules = [];
    this.countdownInterval = null;
    
    // Create Capsule Form State
    this.recordedVoiceBlob = null;
    this.recordedDuration = 0;
    this.selectedPhotos = [];
    this.recorder = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'page-view capsules-page-wrapper';

    this.container.innerHTML = `
      <div class="section-title-wrap" style="text-align: left; margin-bottom: 2rem;">
        <h2 class="section-title">Future Capsules</h2>
        <p class="section-subtitle">Lock away photos, voices, and letters to be opened on a future date.</p>
      </div>

      <div class="capsules-layout" style="display: grid; grid-template-columns: 1fr; gap: 2.5rem; max-width: 900px; margin: 0 auto; width: 100%;">
        
        <!-- Left Pane: Create Capsule Form -->
        <div class="glass-card" style="padding: 2rem; border-radius: 20px; box-shadow: var(--glass-shadow); border: 1px solid var(--border-glow); background: var(--bg-surface);">
          <h3 style="font-family: var(--font-sans); font-weight: 700; color: var(--color-orange); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-file-earmark-lock-fill"></i> Create a Time Capsule
          </h3>
          
          <form id="create-capsule-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.92rem; color: var(--text-primary);">Capsule Title</label>
              <input type="text" id="capsule-title" class="form-control" placeholder="E.g. A Letter to My Future Self" required style="border-radius: 12px; padding: 0.75rem 1rem;" />
            </div>

            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.92rem; color: var(--text-primary);">Written Message</label>
              <textarea id="capsule-message" class="manual-textarea" placeholder="Write your letter here... What do you want to remind yourself of?" required style="width: 100%; height: 120px; border-radius: 12px; padding: 1rem; border: 2px solid var(--glass-border); background: #FFFBF7; outline: none; font-family: var(--font-sans); resize: vertical;"></textarea>
            </div>

            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.92rem; color: var(--text-primary);">Unlock Date & Time</label>
              <input type="datetime-local" id="capsule-unlock-date" class="form-control" required style="border-radius: 12px; padding: 0.75rem 1rem;" />
            </div>

            <!-- Voice Record widget -->
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.92rem; color: var(--text-primary);">Record Voice Note (Optional)</label>
              <div id="capsule-recorder-mount" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 14px; border: 1px solid var(--border-glow);"></div>
              <div id="capsule-voice-status" style="margin-top: 0.75rem; font-size: 0.9rem; min-height: 20px;"></div>
            </div>

            <!-- Photo Upload widget -->
            <div>
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.92rem; color: var(--text-primary);">Upload Photos (Optional)</label>
              <label style="display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed rgba(255,141,161,0.25); border-radius: 14px; padding: 1.5rem; background: #FFFBF7; cursor: pointer; transition: border-color 0.3s; text-align: center; width: 100%;">
                <i class="bi bi-images" style="font-size: 1.8rem; color: var(--color-orange); margin-bottom: 0.25rem;"></i>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">Select Photos</span>
                <input type="file" id="capsule-photos-input" multiple accept="image/*" style="display: none;" />
              </label>
              <div id="capsule-photos-preview" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 0.5rem; margin-top: 0.75rem;"></div>
            </div>

            <button type="submit" class="btn-submit-memory" style="width: 100%; border-radius: 30px; padding: 0.85rem; font-size: 1rem; margin-top: 1rem;">
              <i class="bi bi-lock-fill"></i> Seal Time Capsule
            </button>
          </form>
        </div>

        <!-- Right Pane: Sealed Capsules List -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <h3 style="font-family: var(--font-sans); font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-archive-fill" style="color: var(--color-orange);"></i> Sealed Vaults
          </h3>
          <div id="capsules-list-mount" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Capsules populated here -->
          </div>
        </div>

      </div>
    `;

    this.bindFormEvents();
    this.loadCapsules();

    return this.container;
  }

  bindFormEvents() {
    const form = this.container.querySelector('#create-capsule-form');
    const photosInput = this.container.querySelector('#capsule-photos-input');
    const photosPreview = this.container.querySelector('#capsule-photos-preview');
    const voiceStatus = this.container.querySelector('#capsule-voice-status');

    // Default unlock date set to 2 minutes from now for quick testing
    const defaultUnlock = new Date(Date.now() + 120 * 1000);
    // Format to yyyy-MM-ddThh:mm matching local format
    const offset = defaultUnlock.getTimezoneOffset();
    const localUnlock = new Date(defaultUnlock.getTime() - (offset * 60 * 1000));
    this.container.querySelector('#capsule-unlock-date').value = localUnlock.toISOString().slice(0, 16);

    // Mount voice recorder
    const handleRecordStop = (blob, duration) => {
      this.recordedVoiceBlob = blob;
      this.recordedDuration = duration;
      synth.playClick();
      voiceStatus.innerHTML = `
        <span style="color: #ff8da1; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
          <i class="bi bi-check-circle-fill"></i> Voice recording attached (${duration}s)
        </span>
        <button type="button" id="btn-remove-capsule-voice" style="margin-left: 0.5rem; padding: 0.1rem 0.4rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid #ff5572; background: transparent; color: #ff5572; cursor: pointer;">Remove</button>
      `;

      voiceStatus.querySelector('#btn-remove-capsule-voice').addEventListener('click', () => {
        synth.playClick();
        this.recordedVoiceBlob = null;
        this.recordedDuration = 0;
        voiceStatus.innerHTML = '';
        const recLabel = this.container.querySelector('#capsule-recorder-mount .mic-status-label');
        if (recLabel) recLabel.textContent = 'Tap the microphone to start recording';
        const recTimer = this.container.querySelector('#capsule-recorder-mount .mic-timer');
        if (recTimer) recTimer.textContent = '00:00';
      });
    };

    this.recorder = new AudioRecorder(handleRecordStop);
    this.container.querySelector('#capsule-recorder-mount').appendChild(this.recorder.render());

    // Bind Photo uploads
    photosInput.addEventListener('change', (e) => {
      photosPreview.innerHTML = '';
      this.selectedPhotos = Array.from(e.target.files);
      this.selectedPhotos.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const wrap = document.createElement('div');
          wrap.style.borderRadius = '8px';
          wrap.style.overflow = 'hidden';
          wrap.style.border = '1px solid var(--border-glow)';
          wrap.style.aspectRatio = '1';
          wrap.style.width = '60px';
          wrap.style.height = '60px';
          wrap.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;" />`;
          photosPreview.appendChild(wrap);
        };
        reader.readAsDataURL(file);
      });
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = this.container.querySelector('#capsule-title').value.trim();
      const message = this.container.querySelector('#capsule-message').value.trim();
      const unlockDateStr = this.container.querySelector('#capsule-unlock-date').value;

      if (!title || !message || !unlockDateStr) {
        alert('Please fill out all required fields.');
        return;
      }

      synth.playClick();

      // Convert local unlock time to ISO UTC format
      const unlockDate = new Date(unlockDateStr).toISOString();

      const formData = new FormData();
      formData.append('title', title);
      formData.append('message', message);
      formData.append('unlock_date', unlockDate);
      if (this.recordedVoiceBlob) {
        formData.append('audio', this.recordedVoiceBlob, 'capsule_voice.wav');
      }
      if (this.selectedPhotos.length > 0) {
        this.selectedPhotos.forEach(p => {
          formData.append('photos', p);
        });
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-ring" style="width: 16px; height: 16px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 0.5rem; border-top-color: #fff; animation: spin 1s linear infinite;"></span> Sealing...`;

      try {
        await intelApi.createCapsule(formData);
        synth.playConfirmChime();
        
        // Reset form
        form.reset();
        photosPreview.innerHTML = '';
        voiceStatus.innerHTML = '';
        this.recordedVoiceBlob = null;
        this.recordedDuration = 0;
        this.selectedPhotos = [];

        // Reload capsules
        await this.loadCapsules();
      } catch (err) {
        console.error("Failed to create capsule:", err);
        alert("Failed to seal capsule: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-lock-fill"></i> Seal Time Capsule`;
      }
    });
  }

  async loadCapsules() {
    const listMount = this.container.querySelector('#capsules-list-mount');
    listMount.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: 2rem; color: var(--text-secondary);">
        <div class="spinner-ring" style="width: 24px; height: 24px; border-top-color: #ff8da1; animation: spin 1s linear infinite; margin-right: 0.5rem;"></div>
        <span>Retrieving sealed vaults...</span>
      </div>
    `;

    try {
      this.capsules = await intelApi.getCapsules();
      this.renderCapsulesList();
      this.startCountdownTimer();
    } catch (err) {
      console.error(err);
      listMount.innerHTML = `
        <div style="color: #ff5572; text-align: center; padding: 2rem; border: 1px dashed rgba(255, 85, 114, 0.2); border-radius: 12px;">
          Failed to load sealed capsules.
        </div>
      `;
    }
  }

  renderCapsulesList() {
    const listMount = this.container.querySelector('#capsules-list-mount');
    if (this.capsules.length === 0) {
      listMount.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary); border: 2px dashed var(--border-glow); border-radius: 16px; background: rgba(0,0,0,0.01);">
          <i class="bi bi-info-circle" style="font-size: 2rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;"></i>
          <p>No sealed capsules yet. Seal your first memory for the future!</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    this.capsules.forEach(capsule => {
      const card = document.createElement('div');
      card.className = 'glass-card capsule-item-card';
      card.style.padding = '1.8rem';
      card.style.borderRadius = '16px';
      card.style.border = '1px solid var(--border-glow)';
      card.style.background = 'var(--bg-surface)';
      card.style.boxShadow = 'var(--glass-shadow)';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '1rem';
      card.dataset.id = capsule.id;

      const unlockTime = new Date(capsule.unlock_date).getTime();
      const isLocked = Date.now() < unlockTime;

      let revealHtml = '';
      if (!isLocked) {
        // Unlocked media display
        const photosList = capsule.photos || [];
        let photosHtml = '';
        if (photosList.length > 0) {
          const imgs = photosList.map(p => {
            const pUrl = p.startsWith('http') ? p : `http://localhost:8000${p}`;
            return `<img src="${pUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-glow);" />`;
          }).join('');
          photosHtml = `
            <div style="margin-top: 0.5rem;">
              <p style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Attached Photos</p>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">${imgs}</div>
            </div>
          `;
        }

        let voiceHtml = '';
        if (capsule.voice_url) {
          const vUrl = capsule.voice_url.startsWith('http') ? capsule.voice_url : `http://localhost:8000${capsule.voice_url}`;
          voiceHtml = `
            <div style="margin-top: 0.5rem;">
              <p style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Vocal Memory</p>
              <audio controls src="${vUrl}" style="width: 100%; max-width: 320px; height: 36px; border-radius: 8px;"></audio>
            </div>
          `;
        }

        revealHtml = `
          <div class="capsule-revealed-content" style="border-top: 1px solid var(--border-glow); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.8rem;">
            <p style="font-size: 0.98rem; line-height: 1.6; color: var(--text-primary); font-family: var(--font-sans); white-space: pre-wrap;">${capsule.message}</p>
            ${photosHtml}
            ${voiceHtml}
          </div>
        `;
      }

      const lockStateBadge = isLocked 
        ? `<span class="capsule-badge locked" style="background: rgba(255, 141, 161, 0.1); border: 1px solid rgba(255, 141, 161, 0.25); color: #ff8da1; padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i class="bi bi-lock-fill"></i> Sealed
          </span>`
        : `<span class="capsule-badge unlocked" style="background: rgba(160, 231, 229, 0.15); border: 1px solid rgba(160, 231, 229, 0.3); color: #00b4b4; padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;">
            <i class="bi bi-unlock-fill"></i> Unlocked
          </span>`;

      const dateStr = new Date(capsule.unlock_date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div>
            <h4 style="font-family: var(--font-sans); font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--text-primary);">${capsule.title}</h4>
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-family: var(--font-tech);">Unlock Date: ${dateStr}</span>
          </div>
          <div>
            ${lockStateBadge}
          </div>
        </div>

        <div class="capsule-countdown-display" id="display-countdown-${capsule.id}" style="font-family: var(--font-tech); font-weight: 700; color: var(--text-secondary); font-size: 0.95rem;">
          <!-- Countdown text updated live -->
        </div>

        ${revealHtml}
      `;

      listMount.appendChild(card);
    });
  }

  startCountdownTimer() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const updateCountdowns = () => {
      this.capsules.forEach(capsule => {
        const display = this.container.querySelector(`#display-countdown-${capsule.id}`);
        if (!display) return;

        const unlockTime = new Date(capsule.unlock_date).getTime();
        const diff = unlockTime - Date.now();

        if (diff <= 0) {
          display.innerHTML = `<span style="color: #00b4b4;"><i class="bi bi-unlock-fill" style="margin-right: 0.25rem;"></i> Vault unlocked!</span>`;
          if (capsule.is_locked) {
            capsule.is_locked = false;
            setTimeout(() => { this.loadCapsules(); }, 1500);
          }
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);

          let timerStr = 'Unlocks in: ';
          if (days > 0) timerStr += `${days}d `;
          if (hours > 0 || days > 0) timerStr += `${hours}h `;
          timerStr += `${mins}m ${secs}s`;

          display.innerHTML = `<span style="color: var(--text-secondary);"><i class="bi bi-clock-history" style="margin-right: 0.25rem;"></i> ${timerStr}</span>`;
        }
      });
    };

    updateCountdowns();
    this.countdownInterval = setInterval(updateCountdowns, 1000);
  }

  destroy() {
    if (this.recorder) {
      this.recorder.destroy();
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
