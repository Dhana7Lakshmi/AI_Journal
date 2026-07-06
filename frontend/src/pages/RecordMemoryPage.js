/**
 * LifeReel AI - RecordMemoryPage View
 * Redesigned Create Memory flow in the following order:
 * 1. Write Memory
 * 2. Record Voice (Optional)
 * 3. Upload Photos (Recommended)
 * 4. Generate Memory Illustration (Optional)
 * 5. Save Memory
 */
import { AudioRecorder } from '../components/AudioRecorder.js';
import { synth } from '../utils/synth.js';
import { intelApi } from '../api/api.js';

export class RecordMemoryPage {
  constructor() {
    this.recorder = null;
    this.recordedVoiceBlob = null;
    this.recordedDuration = 0;
    this.selectedPhotos = [];
  }

  render() {
    const container = document.createElement('div');
    container.className = 'page-view recorder-container';

    container.innerHTML = `
      <div class="recorder-header-wrap" style="text-align: center; margin-bottom: 2.5rem;">
        <h2 class="recorder-title" style="font-family: var(--font-sans); font-weight: 700; color: var(--text-primary);">Preserve a Memory</h2>
        <p class="recorder-subtitle" style="color: var(--text-secondary);">AI-assisted memory preservation platform. Keep your real life moments close.</p>
      </div>

      <div class="glass-card" style="max-width: 650px; width: 100%; margin: 0 auto; padding: 2.5rem; border-radius: 24px; box-shadow: var(--glass-shadow); border: 1px solid var(--border-glow); background: var(--bg-surface); display: flex; flex-direction: column; gap: 2rem;">
        
        <!-- Step 1: Write Memory -->
        <div class="step-section">
          <h4 style="font-family: var(--font-sans); font-weight: 600; font-size: 1.1rem; color: var(--color-orange); margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-pencil-fill"></i> 1. Write Down Your Thoughts
          </h4>
          <textarea class="manual-textarea" id="text-memory-input" style="width: 100%; height: 140px; border-radius: 16px; padding: 1rem; border: 2px solid var(--glass-border); background: #FFFBF7; color: var(--text-primary); font-family: var(--font-sans); font-size: 1rem; outline: none; transition: var(--transition-smooth); resize: vertical;" placeholder="What happened today? How did you feel? Write your story here..."></textarea>
        </div>

        <!-- Step 2: Record Voice (Optional) -->
        <div class="step-section">
          <h4 style="font-family: var(--font-sans); font-weight: 600; font-size: 1.1rem; color: var(--color-orange); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-mic-fill"></i> 2. Record Voice (Optional)
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Speak freely to add a vocal entry note to this memory.</p>
          
          <div id="recorder-widget-mount" style="width: 100%;"></div>
          
          <!-- Attachment State -->
          <div id="voice-attached-status" style="margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 0.95rem; min-height: 24px;"></div>
        </div>

        <!-- Step 3: Upload Photos (Recommended) -->
        <div class="step-section">
          <h4 style="font-family: var(--font-sans); font-weight: 600; font-size: 1.1rem; color: var(--color-orange); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-images"></i> 3. Upload Photos (Recommended)
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Upload photos from this day. The first photo is automatically used as the cover photo.</p>
          
          <label class="photo-upload-label" style="display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed rgba(255,141,161,0.25); border-radius: 16px; padding: 2rem; background: #FFFBF7; cursor: pointer; transition: border-color 0.3s; text-align: center; width: 100%;">
            <i class="bi bi-cloud-arrow-up" style="font-size: 2.2rem; color: var(--color-orange); margin-bottom: 0.5rem;"></i>
            <span style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">Click to select photos</span>
            <span style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Supports multiple JPEGs, PNGs</span>
            <input type="file" id="photos-input" multiple accept="image/*" style="display: none;" />
          </label>
          
          <!-- Image previews container -->
          <div id="photos-preview-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.6rem; margin-top: 1rem;"></div>
        </div>

        <!-- Step 4: Generate Illustration (Optional) -->
        <div class="step-section" style="padding: 1.2rem; border-radius: 16px; background: rgba(255, 141, 161, 0.04); border: 1px solid rgba(255, 141, 161, 0.1);">
          <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; user-select: none;">
            <input type="checkbox" id="generate-illustration-checkbox" style="margin-top: 0.3rem; width: 18px; height: 18px; accent-color: var(--color-orange);" />
            <div>
              <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">4. Generate Memory Illustration (Optional)</span>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.4; margin-bottom: 0;">
                Use your own photos whenever possible. Generate an illustration only when photos are unavailable.
              </p>
            </div>
          </label>
        </div>

        <!-- Step 5: Save Memory -->
        <div class="save-memory-section" style="margin-top: 1rem; display: flex; justify-content: center; width: 100%;">
          <button class="btn-submit-memory" id="btn-save-memory-unified" style="min-width: 250px; padding: 0.9rem 2.2rem; font-size: 1.05rem; border-radius: 30px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition-smooth);">
            <i class="bi bi-shield-check" style="font-size: 1.15rem;"></i>
            <span>Save Memory</span>
          </button>
        </div>

      </div>
    `;

    // Initialize state
    this.recordedVoiceBlob = null;
    this.recordedDuration = 0;
    this.selectedPhotos = [];

    // Initialize AudioRecorder
    const handleRecordStop = async (blob, duration) => {
      this.recordedVoiceBlob = blob;
      this.recordedDuration = duration;
      synth.playClick();

      const voiceStatus = container.querySelector('#voice-attached-status');
      if (!voiceStatus) return;

      const runTranscription = async () => {
        // Show loading state
        voiceStatus.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--color-orange); font-weight: 500; width: 100%;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="spinner" style="width: 1.25rem; height: 1.25rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.75s linear infinite;"></div>
              <span>Transcribing audio locally...</span>
            </div>
            <style>
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </div>
        `;

        try {
          const res = await intelApi.transcribeAudio(blob);
          const transcript = res.transcript ? res.transcript.trim() : "";
          
          voiceStatus.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                <span style="color: #ff8da1; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="bi bi-check-circle-fill"></i> Voice note attached (${duration}s)
                </span>
                <button id="btn-remove-voice" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid #ff5572; background: transparent; color: #ff5572; cursor: pointer; transition: all 0.3s;">Remove</button>
              </div>
              
              ${transcript ? `
                <div style="border-radius: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; text-align: left; width: 100%;">
                  <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-orange); margin-bottom: 0.5rem; font-weight: 600;">Transcript Preview</div>
                  <p style="font-size: 0.95rem; color: var(--text-primary); margin: 0; line-height: 1.5; font-style: italic;">"${transcript}"</p>
                </div>
              ` : `
                <div style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">(Audio was completely silent)</div>
              `}
            </div>
          `;

          // Append transcript to the manual thoughts textarea
          if (transcript) {
            const textarea = container.querySelector('#text-memory-input');
            if (textarea) {
              const currentText = textarea.value.trim();
              if (currentText) {
                textarea.value = `${currentText}\n\n${transcript}`;
              } else {
                textarea.value = transcript;
              }
            }
          }

          // Bind remove button
          voiceStatus.querySelector('#btn-remove-voice').addEventListener('click', () => {
            synth.playClick();
            this.recordedVoiceBlob = null;
            this.recordedDuration = 0;
            voiceStatus.innerHTML = '';
            const recorderLabel = container.querySelector('.mic-status-label');
            if (recorderLabel) {
              recorderLabel.textContent = 'Tap the microphone to start recording';
            }
            const recorderTimer = container.querySelector('.mic-timer');
            if (recorderTimer) {
              recorderTimer.textContent = '00:00';
            }
          });

        } catch (err) {
          console.error("Local audio transcription failed:", err);
          voiceStatus.innerHTML = `
            <div style="color: #ff5572; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; text-align: center;">
              <span><i class="bi bi-exclamation-triangle-fill"></i> Transcription failed: ${err.message || err}</span>
              <div style="display: flex; gap: 0.5rem;">
                <button id="btn-retry-transcribe" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--color-orange); background: transparent; color: var(--color-orange); cursor: pointer; transition: all 0.3s;">Retry</button>
                <button id="btn-remove-voice-failed" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid #ff5572; background: transparent; color: #ff5572; cursor: pointer; transition: all 0.3s;">Remove</button>
              </div>
            </div>
          `;

          voiceStatus.querySelector('#btn-retry-transcribe').addEventListener('click', () => {
            synth.playClick();
            runTranscription();
          });

          voiceStatus.querySelector('#btn-remove-voice-failed').addEventListener('click', () => {
            synth.playClick();
            this.recordedVoiceBlob = null;
            this.recordedDuration = 0;
            voiceStatus.innerHTML = '';
            const recorderLabel = container.querySelector('.mic-status-label');
            if (recorderLabel) {
              recorderLabel.textContent = 'Tap the microphone to start recording';
            }
            const recorderTimer = container.querySelector('.mic-timer');
            if (recorderTimer) {
              recorderTimer.textContent = '00:00';
            }
          });
        }
      };

      await runTranscription();
    };

    this.recorder = new AudioRecorder(handleRecordStop);
    container.querySelector('#recorder-widget-mount').appendChild(this.recorder.render());

    // Bind Photo upload and Previews
    const photosInput = container.querySelector('#photos-input');
    const previewContainer = container.querySelector('#photos-preview-container');

    photosInput.addEventListener('change', (e) => {
      previewContainer.innerHTML = '';
      this.selectedPhotos = Array.from(e.target.files);
      
      this.selectedPhotos.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const wrap = document.createElement('div');
          wrap.style.position = 'relative';
          wrap.style.borderRadius = '10px';
          wrap.style.overflow = 'hidden';
          wrap.style.border = '1px solid var(--border-glow)';
          wrap.style.aspectRatio = '1';
          wrap.style.width = '100%';
          
          wrap.innerHTML = `
            <img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.65rem; text-align: center; padding: 0.15rem 0; font-family: var(--font-sans); font-weight: 500;">
              ${index === 0 ? 'Cover' : `Photo ${index + 1}`}
            </span>
          `;
          previewContainer.appendChild(wrap);
        };
        reader.readAsDataURL(file);
      });
    });

    // Handle unified Save Memory
    const textarea = container.querySelector('#text-memory-input');
    const checkbox = container.querySelector('#generate-illustration-checkbox');
    const saveBtn = container.querySelector('#btn-save-memory-unified');

    saveBtn.addEventListener('click', () => {
      const textVal = textarea.value.trim();
      
      if (!textVal && !this.recordedVoiceBlob) {
        alert('Please write something down or record a voice note before saving!');
        return;
      }

      synth.playClick();

      // Store memory metadata in session draft
      sessionStorage.setItem('lifereel_draft', JSON.stringify({
        type: 'unified',
        rawText: textVal,
        generateIllustration: checkbox.checked,
        duration: this.recordedDuration || Math.max(10, Math.ceil(textVal.split(' ').length * 0.4))
      }));

      // Store files in global window reference for ProcessingPage to pick up
      window.lifereel_recorded_blob = this.recordedVoiceBlob;
      window.lifereel_photos_to_upload = this.selectedPhotos;

      // Navigate to ProcessingPage
      window.location.hash = '#processing';
    });

    return container;
  }

  onMount() {}

  destroy() {
    if (this.recorder) {
      this.recorder.destroy();
    }
  }
}
