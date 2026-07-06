/**
 * LifeReel AI - Audio Upload Box Component
 */

export class UploadBox {
  constructor(onUploadComplete) {
    this.onUploadComplete = onUploadComplete;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'audio-uploader-wrap';
    container.id = 'audio-upload-zone';

    container.innerHTML = `
      <div class="uploader-icon"><i class="bi bi-cloud-upload"></i></div>
      <div class="uploader-text">
        <h5>Upload Audio File</h5>
        <p>Drag & drop audio files here or click to choose a file (.mp3, .wav, .m4a)</p>
      </div>
      <input type="file" id="audio-file-input" accept="audio/*" style="display: none;" />
    `;

    const fileInput = container.querySelector('#audio-file-input');

    // Trigger file dialog
    container.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag and drop events
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.classList.add('dragover');
    });

    container.addEventListener('dragleave', () => {
      container.classList.remove('dragover');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('audio/')) {
        this.processFile(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    });

    return container;
  }

  processFile(file) {
    // Generate a random duration for mock purposes (e.g. 10 - 45s)
    const mockDuration = Math.floor(Math.random() * 35) + 10;
    if (this.onUploadComplete) {
      this.onUploadComplete(file, mockDuration);
    }
  }
}
