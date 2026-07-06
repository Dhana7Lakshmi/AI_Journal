
export class RewindCard {
  constructor(memories) {
    this.memories = memories || [];
    this.activeIndex = 0;
    this.progressInterval = null;
    this.duration = 6000; // 6 seconds per slide
    this.slideEls = [];
    this.indicatorEls = [];
    this.totals = this.calculateStats();
  }

  calculateStats() {
    const counts = { Calm: 0, Nostalgic: 0, Inspired: 0, Grateful: 0, Joyful: 0 };
    let totalDuration = 0;
    
    this.memories.forEach(m => {
      const moodVal = m.emotion || m.dominant_emotion || m.mood || 'Calm';
      if (counts[moodVal] !== undefined) {
        counts[moodVal]++;
      }
      totalDuration += (m.duration || 0);
    });
    
    let maxVal = -1;
    let dominantMood = 'Calm';
    Object.keys(counts).forEach(m => {
      if (counts[m] > maxVal) {
        maxVal = counts[m];
        dominantMood = m;
      }
    });

    return {
      counts,
      totalDuration,
      dominantMood,
      totalCount: this.memories.length
    };
  }

  render() {
    const container = document.createElement('div');
    container.className = 'rewind-slide-card';
    container.id = 'rewind-carousel';

    const moodTranslation = {
      Calm: '🌸 Soothing Wave',
      Nostalgic: '🧸 Warm Hug',
      Inspired: '✨ Sparkle Dust',
      Grateful: '💖 Sweet Heart',
      Joyful: '☀️ Happy Sunshine'
    };

    const reflections = {
      Calm: "You have been feeling calm and peaceful. Taking quiet moments for yourself has helped keep you relaxed and content.",
      Nostalgic: "You have been feeling nostalgic. Reflecting on sweet past moments has kept you feeling warm and anchored.",
      Inspired: "You have been feeling very inspired! Creative ideas and projects are flowing nicely. Keep shining!",
      Grateful: "You have been feeling incredibly grateful. Connecting with friends and loved ones has brought warmth to your heart.",
      Joyful: "You have been feeling so joyful! Happy highlights and bright moments have filled your week with sunshine."
    };

    // Calculate collage items (saved images or text quotes)
    const collageSlice = this.memories.slice(0, 4);
    const collageItems = [];
    const backendUrl = 'http://localhost:8000';
    for (let i = 0; i < 4; i++) {
      const memory = collageSlice[i];
      if (memory) {
        const photos = memory.photos || [];
        const rawImg = photos.length > 0 ? photos[0] : (memory.image_url || memory.image || '');
        const resolvedImg = rawImg ? (rawImg.startsWith('http') ? rawImg : `${backendUrl}${rawImg}`) : '';
        const hasImage = !!resolvedImg;
        const moodVal = memory.emotion || memory.dominant_emotion || memory.mood || 'Calm';

        if (hasImage) {
          collageItems.push({
            type: 'image',
            image: resolvedImg,
            title: memory.title,
            moodLabel: moodTranslation[moodVal] || moodVal
          });
        } else {
          collageItems.push({
            type: 'quote',
            title: memory.title,
            moodLabel: moodTranslation[moodVal] || moodVal
          });
        }
      } else {
        // Fallbacks
        const defaultTitles = [
          'Cozy walk in the morning light',
          'A quiet moment reading tea logs',
          'Coding bubbly layouts with music',
          'Warm conversations until late'
        ];
        const defaultMoods = ['Calm', 'Nostalgic', 'Inspired', 'Grateful'];
        collageItems.push({
          type: 'quote',
          title: defaultTitles[i],
          moodLabel: moodTranslation[defaultMoods[i]]
        });
      }
    }

    container.innerHTML = `
      <!-- Top indicators -->
      <div class="story-indicators" id="carousel-indicators">
        <div class="story-indicator-bar"><div class="story-indicator-fill"></div></div>
        <div class="story-indicator-bar"><div class="story-indicator-fill"></div></div>
        <div class="story-indicator-bar"><div class="story-indicator-fill"></div></div>
        <div class="story-indicator-bar"><div class="story-indicator-fill"></div></div>
      </div>

      <!-- Navigation triggers -->
      <div class="slide-nav-area slide-nav-left" id="carousel-prev" aria-label="Previous Slide">
        <span class="slide-nav-btn"><i class="bi bi-chevron-left"></i></span>
      </div>
      <div class="slide-nav-area slide-nav-right" id="carousel-next" aria-label="Next Slide">
        <span class="slide-nav-btn"><i class="bi bi-chevron-right"></i></span>
      </div>

      <div class="rewind-slides-viewport">
        <!-- Slide 1: Cover -->
        <div class="rewind-slide active" id="rewind-slide-0">
          <div class="slide-recap-content">
            <div class="slide-text-side" style="flex: 1;">
              <span class="slide-tag">Weekly Summary</span>
              <h3 class="slide-title-serif">Weekly Recap</h3>
              <p class="slide-description">We have summarized your last ${this.memories.length} entries. Let's look back at your moods and cozy memory timeline!</p>
            </div>
            <div class="slide-media-side" style="background: var(--bg-surface-hover); display: flex; align-items: center; justify-content: center; padding: 2rem; text-align: center;">
              <div style="font-size: 5rem; color: var(--color-orange); animation: pulseBlue 2s infinite ease-in-out alternate;">🧸</div>
            </div>
          </div>
        </div>

        <!-- Slide 2: Sentiment -->
        <div class="rewind-slide" id="rewind-slide-1">
          <div class="slide-analytics-content">
            <div class="chart-left-pane">
              <span class="slide-tag">Mood Breakdown</span>
              <h3 class="slide-title-serif">Your Mood Balance</h3>
              <p class="slide-description">Here is how your moods were distributed across your voice recordings and text entries.</p>
              
              <div class="mood-breakdown-container" id="rewind-mood-breakdown">
                <!-- Mood rows loaded below -->
              </div>
            </div>
            
            <div class="chart-right-pane">
              <div class="mood-pie-svg-container">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="75" fill="transparent" stroke="#252A36" stroke-width="10"></circle>
                  <circle cx="100" cy="100" r="75" fill="transparent" stroke="var(--color-orange)" stroke-width="10" stroke-dasharray="471" stroke-dashoffset="471" stroke-linecap="round" id="recap-pie-arc"></circle>
                </svg>
                <div class="mood-pie-center-text">
                  <h4 id="recap-dominant-title" style="font-size: 1.15rem;">${moodTranslation[this.totals.dominantMood] || this.totals.dominantMood}</h4>
                  <p>Main Mood</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide 3: Quote Collage -->
        <div class="rewind-slide" id="rewind-slide-2">
          <div class="collage-slide-layout">
            <div class="collage-left-side">
              <span class="slide-tag">Highlights Gallery</span>
              <h3 class="slide-title-serif">Cozy Snippets</h3>
              <p class="slide-description">Highlights and custom drawings saved from your memories this week.</p>
            </div>
            <div class="collage-right-side">
              ${collageItems.map(item => {
                if (item.type === 'image') {
                  return `
                    <div class="collage-img-wrap" style="background-image: url('${item.image}'); background-size: cover; background-position: center; border-radius: 8px; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; flex-direction: column; justify-content: flex-end; padding: 0.5rem; position: relative;">
                      <div class="collage-img-mood-label" style="background: rgba(255, 248, 242, 0.95); font-size: 0.75rem; color: var(--color-orange); font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; align-self: flex-start; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 90%;">
                        ${item.moodLabel}
                      </div>
                    </div>
                  `;
                } else {
                  return `
                    <div class="collage-img-wrap">
                      <div class="collage-quote-bubble">
                        <i class="bi bi-chat-quote-fill"></i>
                        <span>"${item.title}"</span>
                        <div style="font-size: 0.85rem; color: var(--color-orange); font-weight: 700; margin-top: 0.4rem;">${item.moodLabel}</div>
                      </div>
                    </div>
                  `;
                }
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Slide 4: AI summary -->
        <div class="rewind-slide" id="rewind-slide-3">
          <div class="slide-recap-content">
            <div class="slide-text-side" style="flex: 1.5;">
              <span class="slide-tag">Warm Reflections</span>
              <h3 class="slide-title-serif">Cozy AI Reflection</h3>
              <p class="slide-description" style="font-style: italic; font-size: 1.15rem; border-left: 2px solid var(--color-orange); padding-left: 1.5rem; margin-top: 1rem; color: var(--text-primary);">
                "${reflections[this.totals.dominantMood] || reflections.Calm}"
              </p>
            </div>
          </div>
        </div>

      </div>
    `;

    // Elements
    this.slideEls = [
      container.querySelector('#rewind-slide-0'),
      container.querySelector('#rewind-slide-1'),
      container.querySelector('#rewind-slide-2'),
      container.querySelector('#rewind-slide-3')
    ];
    this.indicatorEls = Array.from(container.querySelectorAll('.story-indicator-bar'));

    // Events
    container.querySelector('#carousel-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this.advance(-1);
    });

    container.querySelector('#carousel-next').addEventListener('click', (e) => {
      e.stopPropagation();
      this.advance(1);
    });

    // Pause on hover
    container.addEventListener('mouseenter', () => clearInterval(this.progressInterval));
    container.addEventListener('mouseleave', () => this.startProgress(this.activeIndex));

    // Populate mood breakdown
    const breakdown = container.querySelector('#rewind-mood-breakdown');
    const dominantColors = {
      Calm: '#A0E7E5',
      Nostalgic: '#FFD3B6',
      Inspired: '#D0A1FF',
      Grateful: '#FF8DA1',
      Joyful: '#FFF5B7'
    };

    Object.keys(this.totals.counts).forEach(mood => {
      const count = this.totals.counts[mood];
      const pct = this.totals.totalCount > 0 ? Math.round((count / this.totals.totalCount) * 100) : 0;
      
      const row = document.createElement('div');
      row.className = 'mood-breakdown-row';
      row.innerHTML = `
        <span class="mood-row-label">${moodTranslation[mood] || mood}</span>
        <div class="mood-row-track">
          <div class="mood-row-fill ${mood.toLowerCase()}" style="width: 0%"></div>
        </div>
        <span class="mood-row-percentage">${pct}%</span>
      `;
      breakdown.appendChild(row);
    });

    // Run first progress
    setTimeout(() => {
      this.show(0);
    }, 100);

    return container;
  }

  show(index) {
    clearInterval(this.progressInterval);
    this.activeIndex = index;

    this.slideEls.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    this.indicatorEls.forEach((bar, idx) => {
      const fill = bar.querySelector('.story-indicator-fill');
      if (idx < index) {
        bar.className = 'story-indicator-bar completed';
        fill.style.width = '100%';
      } else if (idx === index) {
        bar.className = 'story-indicator-bar';
        fill.style.width = '0%';
      } else {
        bar.className = 'story-indicator-bar';
        fill.style.width = '0%';
      }
    });

    if (index === 1) {
      setTimeout(() => {
        this.slideEls[1].querySelectorAll('.mood-row-fill').forEach((fill, idx) => {
          const mood = Object.keys(this.totals.counts)[idx];
          const count = this.totals.counts[mood];
          const pct = this.totals.totalCount > 0 ? Math.round((count / this.totals.totalCount) * 100) : 0;
          fill.style.width = `${pct}%`;
        });

        const arc = this.slideEls[1].querySelector('#recap-pie-arc');
        const dominantColor = {
          Calm: '#A0E7E5',
          Nostalgic: '#FFD3B6',
          Inspired: '#D0A1FF',
          Grateful: '#FF8DA1',
          Joyful: '#FFF5B7'
        }[this.totals.dominantMood] || '#A0E7E5';
        
        arc.setAttribute('stroke', dominantColor);
        arc.style.filter = `drop-shadow(0 0 5px ${dominantColor}cc)`;
        
        const ratio = this.totals.totalCount > 0 ? (this.totals.counts[this.totals.dominantMood] / this.totals.totalCount) : 1;
        const perimeter = 2 * Math.PI * 75; // ~471
        arc.style.strokeDasharray = `${perimeter}`;
        arc.style.strokeDashoffset = `${perimeter - (ratio * perimeter)}`;
      }, 100);
    }

    this.startProgress(index);
  }

  startProgress(index) {
    const fill = this.indicatorEls[index].querySelector('.story-indicator-fill');
    const stepTime = 50;
    let elapsed = 0;
    
    this.progressInterval = setInterval(() => {
      elapsed += stepTime;
      const pct = (elapsed / this.duration) * 100;
      fill.style.width = `${Math.min(pct, 100)}%`;
      
      if (elapsed >= this.duration) {
        clearInterval(this.progressInterval);
        this.advance(1);
      }
    }, stepTime);
  }

  advance(direction) {
    let nextIdx = this.activeIndex + direction;
    if (nextIdx >= this.slideEls.length) {
      nextIdx = 0;
    } else if (nextIdx < 0) {
      nextIdx = this.slideEls.length - 1;
    }
    this.show(nextIdx);
  }

  destroy() {
    clearInterval(this.progressInterval);
  }
}
