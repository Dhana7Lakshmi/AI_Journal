/**
 * LifeReel AI - AnalyticsChart (SVG Charts Manager) Component
 */

export class AnalyticsChart {
  renderTrendLine(memories) {
    const container = document.createElement('div');
    container.className = 'trend-svg-wrapper';

    container.innerHTML = `
      <svg id="trend-line-svg" viewBox="0 0 500 220">
        <defs>
          <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-orange)" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="var(--color-orange)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Grid background lines -->
        <line x1="50" y1="30" x2="450" y2="30" class="trend-grid-line"></line>
        <line x1="50" y1="90" x2="450" y2="90" class="trend-grid-line"></line>
        <line x1="50" y1="150" x2="450" y2="150" class="trend-grid-line"></line>
        
        <path id="trend-fill-path" class="trend-graph-bg-path" d=""></path>
        <path id="trend-stroke-path" class="trend-graph-path" d=""></path>
        
        <g id="trend-dots-group"></g>
      </svg>
    `;

    // Calculate weekly indices (mocking stable pacing trend)
    const daysData = [
      { day: 'Mon', val: 150 },
      { day: 'Tue', val: 120 },
      { day: 'Wed', val: 80 },
      { day: 'Thu', val: 160 },
      { day: 'Fri', val: 110 },
      { day: 'Sat', val: 50 },
      { day: 'Sun', val: 90 }
    ];

    // Adjust data slightly based on stored memories counts to feel active
    if (memories && memories.length > 0) {
      daysData[6].val = Math.max(40, 200 - memories.length * 30);
    }

    setTimeout(() => {
      const linePath = container.querySelector('#trend-stroke-path');
      const fillPath = container.querySelector('#trend-fill-path');
      const dotsGroup = container.querySelector('#trend-dots-group');
      if (!linePath || !fillPath || !dotsGroup) return;

      let strokePathD = '';
      let fillPathD = 'M 60 180 ';

      const xStep = 60;
      daysData.forEach((d, idx) => {
        const x = 60 + idx * xStep;
        const y = d.val;
        
        if (idx === 0) {
          strokePathD += `M ${x} ${y} `;
        } else {
          strokePathD += `L ${x} ${y} `;
        }
        fillPathD += `L ${x} ${y} `;
        
        // Add label text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', 205);
        text.setAttribute('fill', 'var(--text-secondary)');
        text.setAttribute('font-size', '10px');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'var(--font-tech)');
        text.textContent = d.day;
        dotsGroup.appendChild(text);
        
        // Add dot
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.className.baseVal = 'trend-graph-dot';
        
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Calmness: ${Math.round((220 - y) / 220 * 100)}%`;
        circle.appendChild(title);
        dotsGroup.appendChild(circle);
      });

      fillPathD += `L ${60 + (daysData.length - 1) * xStep} 180 Z`;
      
      linePath.setAttribute('d', strokePathD);
      fillPath.setAttribute('d', fillPathD);
    }, 100);

    return container;
  }

  renderGauge(stabilityScore) {
    const score = stabilityScore || 84;
    const container = document.createElement('div');
    container.className = 'gauge-visual-box';

    container.innerHTML = `
      <div class="gauge-svg-wrap">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" class="gauge-bg-circle"></circle>
          <circle cx="80" cy="80" r="70" class="gauge-fill-circle" id="widget-gauge-arc" style="stroke-dasharray: 440; stroke-dashoffset: 440;"></circle>
        </svg>
        <div class="gauge-center-val">
          <h4 id="widget-gauge-text">0%</h4>
          <span>Calm</span>
        </div>
      </div>
    `;

    setTimeout(() => {
      const arc = container.querySelector('#widget-gauge-arc');
      const text = container.querySelector('#widget-gauge-text');
      if (!arc || !text) return;

      text.textContent = `${score}%`;
      const perimeter = 2 * Math.PI * 70;
      const offset = perimeter - (score / 100 * perimeter);
      
      arc.style.strokeDashoffset = offset;
    }, 150);

    return container;
  }
}
export const analyticsChart = new AnalyticsChart();
