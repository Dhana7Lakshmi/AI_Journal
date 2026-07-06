/**
 * LifeReel AI - LoadingAnimation Component
 * Sequential checklist showing AI parsing steps.
 */

export class LoadingAnimation {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.currentStep = 0;
    this.steps = [
      { id: 'transcribe', text: 'Listening to voice' },
      { id: 'emotion', text: 'Understanding mood' },
      { id: 'story', text: 'Writing story' },
      { id: 'artwork', text: 'Creating memory art' }
    ];
    this.stepInterval = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'loading-overlay-container';

    container.innerHTML = `
      <div class="loading-spinner-wrap">
        <div class="loading-circle"></div>
        <div class="loading-pulse-inner"></div>
      </div>
      <h3 class="loading-text" id="loading-title">Saving your journal...</h3>
      
      <div class="loading-steps-list">
        ${this.steps.map((step, idx) => `
          <div class="loading-step-item" id="step-${step.id}">
            <i class="bi bi-circle" id="icon-${step.id}"></i>
            <span>${step.text}</span>
          </div>
        `).join('')}
      </div>
    `;

    this.startSequencer(container);

    return container;
  }

  startSequencer(container) {
    const titleEl = container.querySelector('#loading-title');
    const items = {
      transcribe: {
        row: container.querySelector('#step-transcribe'),
        icon: container.querySelector('#icon-transcribe')
      },
      emotion: {
        row: container.querySelector('#step-emotion'),
        icon: container.querySelector('#icon-emotion')
      },
      story: {
        row: container.querySelector('#step-story'),
        icon: container.querySelector('#icon-story')
      },
      artwork: {
        row: container.querySelector('#step-artwork'),
        icon: container.querySelector('#icon-artwork')
      }
    };

    const runSeq = () => {
      // Step 1: Transcribing
      if (this.currentStep === 0) {
        titleEl.textContent = 'Listening to voice transcription...';
        items.transcribe.row.classList.add('active');
        items.transcribe.icon.className = 'bi bi-arrow-repeat spin-icon';
        items.transcribe.icon.style.animation = 'spin 2s linear infinite';
      } 
      // Step 2: Emotion
      else if (this.currentStep === 1) {
        titleEl.textContent = 'Finding emotional mood tags...';
        items.transcribe.row.classList.remove('active');
        items.transcribe.row.classList.add('done');
        items.transcribe.icon.className = 'bi bi-check-circle-fill';
        items.transcribe.icon.style.animation = 'none';

        items.emotion.row.classList.add('active');
        items.emotion.icon.className = 'bi bi-arrow-repeat spin-icon';
        items.emotion.icon.style.animation = 'spin 2s linear infinite';
      } 
      // Step 3: Story
      else if (this.currentStep === 2) {
        titleEl.textContent = 'Composing your narrative story...';
        items.emotion.row.classList.remove('active');
        items.emotion.row.classList.add('done');
        items.emotion.icon.className = 'bi bi-check-circle-fill';
        items.emotion.icon.style.animation = 'none';

        items.story.row.classList.add('active');
        items.story.icon.className = 'bi bi-arrow-repeat spin-icon';
        items.story.icon.style.animation = 'spin 2s linear infinite';
      } 
      // Step 4: Artwork
      else if (this.currentStep === 3) {
        titleEl.textContent = 'Preparing custom memory art...';
        items.story.row.classList.remove('active');
        items.story.row.classList.add('done');
        items.story.icon.className = 'bi bi-check-circle-fill';
        items.story.icon.style.animation = 'none';

        items.artwork.row.classList.add('active');
        items.artwork.icon.className = 'bi bi-arrow-repeat spin-icon';
        items.artwork.icon.style.animation = 'spin 2s linear infinite';
      } 
      // Finished
      else if (this.currentStep === 4) {
        items.artwork.row.classList.remove('active');
        items.artwork.row.classList.add('done');
        items.artwork.icon.className = 'bi bi-check-circle-fill';
        items.artwork.icon.style.animation = 'none';

        clearInterval(this.stepInterval);
        setTimeout(() => {
          if (this.onComplete) this.onComplete();
        }, 500);
      }

      this.currentStep++;
    };

    runSeq();
    this.stepInterval = setInterval(runSeq, 1100);
  }

  destroy() {
    clearInterval(this.stepInterval);
  }
}
