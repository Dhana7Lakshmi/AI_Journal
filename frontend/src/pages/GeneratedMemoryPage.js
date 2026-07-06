/**
 * LifeReel AI - GeneratedMemoryPage (Review & Save Dashboard)
 * Renders cute light notebook layout with optional AI artwork configuration.
 */
import { intelApi } from '../api/api.js';
import { db } from '../utils/db.js';
import { auth } from '../utils/auth.js';
import { synth } from '../utils/synth.js';
import { MoodTag } from '../components/MoodTag.js';

export class GeneratedMemoryPage {
  constructor() {
    this.memoryData = null;
    this.hasImage = false; // default to text-only cozy default
  }

  render() {
    const container = document.createElement('div');
    container.className = 'page-view';

    this.memoryData = JSON.parse(sessionStorage.getItem('lifereel_generated'));
    if (!this.memoryData) {
      setTimeout(() => {
        window.location.hash = '#record';
      }, 50);
      return container;
    }

    const moodTag = new MoodTag().render(this.memoryData.mood);

    container.innerHTML = `
      <div class="section-title-wrap" style="text-align: left; margin-bottom: 2rem; max-width: 900px; margin-left: auto; margin-right: auto;">
        <h2 class="section-title">Review Today's Entry</h2>
        <p class="section-subtitle">Read and personalize your generated memory story before saving.</p>
      </div>

      <div class="generated-container" style="max-width: 900px;">
        <!-- Left Pane: Diary Text details -->
        <div class="generated-text-pane">
          <div class="generated-title-wrap" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
              <h2>${this.memoryData.title}</h2>
              <div style="position: relative; display: inline-block;">${moodTag}</div>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.95rem; font-family: var(--font-tech); text-transform: uppercase; letter-spacing: 1px;">
              Mood Calmness Score: ${this.memoryData.stability}%
            </p>
          </div>

          <!-- Story Text Block (Editable) -->
          <div class="generated-story-wrap">
            <h4 style="font-family: var(--font-serif); margin-bottom: 1rem; color: var(--color-orange);">Diary Narrative</h4>
            <textarea id="edit-narrative" class="manual-textarea" style="height: 200px; line-height: 1.7; background: #FFFBF7; border: 2px solid rgba(255,141,161,0.15); font-size: 1rem; width: 100%; color: var(--text-primary);">${this.memoryData.narrative}</textarea>
          </div>
        </div>

        <!-- Right Pane: Artwork Options -->
        <div class="generated-controls-pane" style="margin-top: 1rem;">
          <div class="artwork-option-box" id="artwork-config-card" style="background: var(--bg-surface); border: 2px solid rgba(255,141,161,0.15); border-radius: 20px; padding: 2rem; box-shadow: var(--glass-shadow); display: flex; flex-direction: column; gap: 1.5rem;">
            <h4 style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700;">Memory Illustration</h4>
            
            <div class="option-cards">
              <!-- Text only (Default) -->
              <div class="option-card active" id="opt-text-only">
                <div class="option-card-radio"></div>
                <div class="option-card-details">
                  <h5>Save as Text-Only Memory</h5>
                  <p>Clean notepad page, no visuals</p>
                </div>
              </div>

              <!-- Artwork -->
              <div class="option-card" id="opt-generate-art">
                <div class="option-card-radio"></div>
                <div class="option-card-details">
                  <h5>Generate Memory Illustration</h5>
                  <p>Add custom graphic illustration</p>
                </div>
              </div>
            </div>

            <!-- Artwork Preview container (Only visible when hasImage is true) -->
            <div class="generated-media-preview" id="media-frame">
              <img src="${this.memoryData.image || ''}" alt="Generated memory artwork" id="preview-art-img">
            </div>

            <div class="generated-actions-row" id="regen-row" style="display: none;">
              <button class="btn-regenerate-art" id="btn-regen-img" style="width: 100%;">
                <i class="bi bi-arrow-repeat"></i>
                <span>Regenerate Art</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CTA Action Buttons -->
        <div class="generated-controls-pane">
          <div class="generated-actions-row">
            <button class="btn-save-memory" id="btn-save-node">
              <i class="bi bi-shield-check"></i>
              <span>Save Memory</span>
            </button>
            <button class="btn-regenerate-art" id="btn-cancel-node" style="border-color: #ff5572; color: #ff5572;">
              <i class="bi bi-trash"></i>
              <span>Discard</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Elements
    const optArt = container.querySelector('#opt-generate-art');
    const optText = container.querySelector('#opt-text-only');
    const configCard = container.querySelector('#artwork-config-card');
    const previewArtImg = container.querySelector('#preview-art-img');
    const btnRegen = container.querySelector('#btn-regen-img');
    const regenRow = container.querySelector('#regen-row');
    const btnSave = container.querySelector('#btn-save-node');
    const btnCancel = container.querySelector('#btn-cancel-node');
    const narrativeInput = container.querySelector('#edit-narrative');

    // Toggles
    optArt.addEventListener('click', () => {
      this.hasImage = true;
      optText.classList.remove('active');
      optArt.classList.add('active');
      configCard.classList.add('show-art');
      regenRow.style.display = 'block';
      synth.playClick();
    });

    optText.addEventListener('click', () => {
      this.hasImage = false;
      optArt.classList.remove('active');
      optText.classList.add('active');
      configCard.classList.remove('show-art');
      regenRow.style.display = 'none';
      synth.playClick();
    });

    // Image regeneration
    btnRegen.addEventListener('click', async () => {
      if (!this.hasImage) return;
      btnRegen.disabled = true;
      btnRegen.querySelector('span').textContent = 'Generating...';
      btnRegen.querySelector('i').className = 'bi bi-arrow-repeat spin-icon';
      btnRegen.querySelector('i').style.animation = 'spin 1.5s linear infinite';
      
      try {
        const newArt = await intelApi.generateArtwork(this.memoryData.transcript, this.memoryData.mood);
        this.memoryData.image = newArt;
        previewArtImg.src = newArt;
      } catch (err) {
        console.error(err);
      } finally {
        btnRegen.disabled = false;
        btnRegen.querySelector('span').textContent = 'Regenerate Art';
        btnRegen.querySelector('i').className = 'bi bi-arrow-repeat';
        btnRegen.querySelector('i').style.animation = 'none';
      }
    });

    // Save memory
    btnSave.addEventListener('click', () => {
      const editedNarrative = narrativeInput.value.trim();
      if (!editedNarrative) {
        alert('Memory story cannot be blank.');
        return;
      }

      const memoryToCommit = {
        title: this.memoryData.title,
        mood: this.memoryData.mood,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        image: this.hasImage ? this.memoryData.image : null,
        narrative: editedNarrative,
        duration: this.memoryData.duration,
        timestamp: Date.now(),
        isFavorite: false,
        hasImage: this.hasImage,
        transcript: this.memoryData.transcript,
        stability: this.memoryData.stability
      };

      db.save(memoryToCommit);
      auth.incrementStreak();
      synth.playConfirmChime();

      // Clear session cache
      sessionStorage.removeItem('lifereel_generated');

      // Redirect to Timeline
      window.location.hash = '#timeline';
    });

    // Discard node
    let cancelConfirmState = false;
    let cancelTimeout = null;

    btnCancel.addEventListener('click', () => {
      synth.playClick();
      if (!cancelConfirmState) {
        cancelConfirmState = true;
        btnCancel.querySelector('span').textContent = 'Confirm Discard?';
        btnCancel.querySelector('i').className = 'bi bi-question-circle-fill';
        btnCancel.style.background = '#ff5572';
        btnCancel.style.color = '#FFFFFF';
        btnCancel.style.borderColor = '#ff5572';
        
        cancelTimeout = setTimeout(() => {
          cancelConfirmState = false;
          btnCancel.querySelector('span').textContent = 'Discard';
          btnCancel.querySelector('i').className = 'bi bi-trash';
          btnCancel.style.background = 'transparent';
          btnCancel.style.color = '#ff5572';
          btnCancel.style.borderColor = '#ff5572';
        }, 3000);
      } else {
        clearTimeout(cancelTimeout);
        sessionStorage.removeItem('lifereel_generated');
        window.location.hash = '#timeline';
      }
    });

    return container;
  }

  onMount() {}
}
