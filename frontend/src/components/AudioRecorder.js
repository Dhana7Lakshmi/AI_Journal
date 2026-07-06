/**
 * LifeReel AI - AudioRecorder Component
 * Connects to Web Audio API for real microphone capture and visualizes frequencies,
 * falling back to beautiful simulated wave oscillators if permission is denied.
 */

export class AudioRecorder {
  constructor(onRecordingStop) {
    this.onRecordingStop = onRecordingStop;
    this.isRecording = false;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    this.recordStartTime = 0;
    this.timerInterval = null;
    this.recordedDuration = 0;
    this.animationId = null;
    this.canvas = null;
    this.canvasCtx = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'recorder-ui-wrapper';
    container.style.width = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    container.innerHTML = `
      <!-- Pulsing Mic Node -->
      <div class="mic-ring-container" id="widget-mic-container">
        <div class="mic-pulse-ring"></div>
        <button class="btn-mic-main" id="widget-btn-mic" aria-label="Toggle Memory Record">
          <i class="bi bi-mic-mute" id="widget-mic-icon"></i>
        </button>
      </div>
      
      <div class="mic-status-label" id="widget-mic-status">Tap the microphone to start recording</div>
      <div class="mic-timer" id="widget-mic-timer">00:00</div>

      <!-- Waveform Canvas -->
      <div class="waveform-container" style="margin-top: 1.5rem;">
        <canvas id="widget-waveform-canvas"></canvas>
      </div>
    `;

    // Elements
    const btnMic = container.querySelector('#widget-btn-mic');
    const micIcon = container.querySelector('#widget-mic-icon');
    const micContainer = container.querySelector('#widget-mic-container');
    const micStatus = container.querySelector('#widget-mic-status');
    const micTimer = container.querySelector('#widget-mic-timer');
    this.canvas = container.querySelector('#widget-waveform-canvas');
    this.canvasCtx = this.canvas.getContext('2d');

    // Resize canvas
    setTimeout(() => {
      this.resizeCanvas();
      this.draw();
    }, 100);

    // Event listener
    btnMic.addEventListener('click', () => {
      if (!this.isRecording) {
        this.start(micContainer, micIcon, micStatus, micTimer);
      } else {
        this.stop(micContainer, micIcon, micStatus);
      }
    });

    window.addEventListener('resize', () => this.resizeCanvas());

    return container;
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = this.canvas.parentElement.clientWidth || 600;
      this.canvas.height = 80;
    }
  }

  async start(containerEl, iconEl, statusEl, timerEl) {
    this.isRecording = true;
    containerEl.classList.add('recording');
    iconEl.className = 'bi bi-mic-fill';
    statusEl.textContent = 'Recording voice... Tap again to stop and save';
    
    this.recordStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
      this.recordedDuration = elapsed;
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    this.audioChunks = [];

    try {
      // Access real microphone with high-fidelity speech configuration
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,           // Mono is preferred for Speech-to-Text
          sampleRate: 48000,         // High-quality sample rate
          sampleSize: 16,            // Standard CD quality bit depth
          echoCancellation: true,    // Reduce background echo
          noiseSuppression: true,    // Suppress dynamic ambient noise
          autoGainControl: true      // Level out vocal volumes automatically
        }
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Configure MediaRecorder for high audio bitrates
      const recorderOptions = {
        audioBitsPerSecond: 256000 // High bitrate (256 kbps)
      };

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recorderOptions.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        recorderOptions.mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        recorderOptions.mimeType = 'audio/mp4';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      this.mediaRecorder.start();
    } catch (err) {
      console.warn("Microphone access denied or unavailable. Falling back to synthetic oscillations.", err);
      // Clean up in case audio state got partially initialized
      this.analyser = null; 
      this.mediaRecorder = null;
    }
  }

  stop(containerEl, iconEl, statusEl) {
    this.isRecording = false;
    containerEl.classList.remove('recording');
    iconEl.className = 'bi bi-mic-mute';
    statusEl.textContent = 'Tap the microphone to start recording';
    clearInterval(this.timerInterval);

    const finishStop = () => {
      // Stop streams
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      if (this.audioContext) {
        this.audioContext.close();
      }

      const duration = this.recordedDuration || 5;
      let audioBlob;
      if (this.audioChunks && this.audioChunks.length > 0) {
        const mimeType = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
        audioBlob = new Blob(this.audioChunks, { type: mimeType });
      } else {
        // Fallback dummy silent WAV blob
        audioBlob = new Blob([new Uint8Array(1000)], { type: 'audio/wav' });
      }

      if (this.onRecordingStop) {
        this.onRecordingStop(audioBlob, duration);
      }
    };

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = finishStop;
      this.mediaRecorder.stop();
    } else {
      finishStop();
    }
  }

  draw() {
    if (!this.canvas || !this.canvasCtx) return;
    
    this.animationId = requestAnimationFrame(() => this.draw());

    const width = this.canvas.width;
    const height = this.canvas.height;
    
    this.canvasCtx.clearRect(0, 0, width, height);
    this.canvasCtx.lineWidth = 2;
    
    const sliceWidth = width / 80;
    let x = 0;

    // Fetch frequencies or use simulated waves
    const hasRealAudio = this.isRecording && this.analyser && this.dataArray;
    if (hasRealAudio) {
      this.analyser.getByteFrequencyData(this.dataArray);
    }

    for (let i = 0; i < 80; i++) {
      let amp = 2;
      
      if (this.isRecording) {
        if (hasRealAudio) {
          // Map real analyser values to amplitude
          const dataVal = this.dataArray[i % this.dataArray.length] || 0;
          amp = (dataVal / 255) * 35 + 2;
        } else {
          // Synthetic wave math
          amp = (Math.sin(Date.now() * 0.007 + i * 0.08) * 28 + Math.random() * 12);
        }
      }

      const y = height / 2 + Math.sin(Date.now() * 0.004 + i * 0.06) * amp;
      
      // Dynamic shift of hue
      const hue = (Date.now() * 0.01 + i * 2) % 360;
      this.canvasCtx.strokeStyle = this.isRecording 
        ? `hsla(${hue}, 90%, 55%, 0.85)` 
        : 'rgba(255, 255, 255, 0.08)';
      
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(x, height / 2);
      this.canvasCtx.lineTo(x, y);
      this.canvasCtx.stroke();
      
      x += sliceWidth;
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    clearInterval(this.timerInterval);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
