/**
 * LifeReel AI - ProcessingPage View
 * Manages audio upload / text diary generation and shows progressive status messages.
 */
import { intelApi } from '../api/api.js';

export class ProcessingPage {
  constructor() {
    this.timer = null;
    this.container = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'page-view processing-page-wrapper';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.minHeight = '70vh';
    this.container.style.color = '#FFFFFF';

    this.container.innerHTML = `
      <div class="glass-card processing-card" style="padding: 3.5rem 2.5rem; text-align: center; max-width: 500px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2rem; border-radius: 24px; box-shadow: var(--glass-shadow); border: 1px solid var(--border-glow); background: var(--bg-surface);">
        <!-- Glassmorphic loading circle -->
        <div class="processing-spinner-ring" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(255, 255, 255, 0.05); border-top-color: #ff8da1; animation: spin 1s linear infinite; position: relative;">
          <div style="position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.02); border-bottom-color: #55c2ff; animation: spin 1.8s linear infinite reverse;"></div>
        </div>
        
        <h3 id="processing-status" style="font-family: var(--font-tech); font-weight: 500; font-size: 1.25rem; letter-spacing: 0.5px; min-height: 2.5rem; transition: opacity 0.3s ease; color: #ffffff; margin: 0;">
          Listening closely to your voice…
        </h3>
        
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0; line-height: 1.5;">
          Please keep this tab open while our AI engines sculpt your memory.
        </p>
      </div>
    `;

    return this.container;
  }

  onMount() {
    const statusLabel = this.container.querySelector('#processing-status');
    const startTime = Date.now();

    // Start status machine timer
    this.timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      let msg = '';
      if (elapsed < 3) {
        msg = 'Listening closely to your voice…';
      } else if (elapsed < 6) {
        msg = 'Extracting emotional milestones...';
      } else if (elapsed < 10) {
        msg = 'Painting your visual narrative...';
      } else {
        msg = 'Weaving your digital memory video...';
      }

      if (statusLabel && statusLabel.textContent.trim() !== msg) {
        statusLabel.style.opacity = '0';
        setTimeout(() => {
          statusLabel.textContent = msg;
          statusLabel.style.opacity = '1';
        }, 150);
      }
    }, 100);

    // Run the upload/generation task
    this.runPipeline();
  }

  async runPipeline() {
    const draftData = JSON.parse(sessionStorage.getItem('lifereel_draft'));
    if (!draftData) {
      this.redirectError("No draft entry found.");
      return;
    }

    try {
      let result;

      if (draftData.type === 'unified') {
        const voiceBlob = window.lifereel_recorded_blob;
        const photos = window.lifereel_photos_to_upload || [];

        const formData = new FormData();
        if (draftData.rawText) {
          formData.append('raw_text', draftData.rawText);
        }
        if (voiceBlob) {
          const extension = voiceBlob.type.includes('webm') ? 'webm' : voiceBlob.type.includes('ogg') ? 'ogg' : voiceBlob.type.includes('mp4') ? 'mp4' : 'wav';
          formData.append('audio', voiceBlob, `voice_entry.${extension}`);
        }
        if (photos.length > 0) {
          photos.forEach(photo => {
            formData.append('photos', photo);
          });
        }
        formData.append('generate_illustration', draftData.generateIllustration ? 'true' : 'false');

        result = await intelApi.createMemoryMultipart(formData);
      } else if (draftData.type === 'audio' || draftData.type === 'upload') {
        const audioBlob = window.lifereel_recorded_blob;
        if (!audioBlob) {
          throw new Error("Audio recording data is missing. Please try recording again.");
        }
        result = await intelApi.createMemory(audioBlob);
      } else if (draftData.type === 'text') {
        result = await intelApi.generateEntry(draftData.rawInput);
      } else {
        throw new Error(`Unknown entry type: ${draftData.type}`);
      }

      // Success: clean session & navigate to details
      sessionStorage.removeItem('lifereel_draft');
      delete window.lifereel_recorded_blob; 
      delete window.lifereel_photos_to_upload;

      window.location.hash = `#details?id=${result.id}`;
    } catch (err) {
      console.error("AI Generation pipeline crashed:", err);
      this.redirectError(err.message || "An unexpected error occurred during processing.");
    }
  }

  redirectError(message) {
    this.destroy();
    alert(`Generation Failed: ${message}`);
    window.location.hash = '#record';
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
