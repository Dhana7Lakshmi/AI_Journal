/**
 * LifeReel AI - MoodTag Component
 */

const futuristicMoodNames = {
  Calm: 'Neural Sync',
  Nostalgic: 'Temporal Recall',
  Inspired: 'Synaptic Fire',
  Grateful: 'Harmonic Lock',
  Joyful: 'Serotonin Peak'
};

export class MoodTag {
  render(mood) {
    const cleanMood = mood || 'Calm';
    const tagLabel = futuristicMoodNames[cleanMood] || cleanMood;
    const moodClass = cleanMood.toLowerCase();

    return `
      <span class="polaroid-mood-badge ${moodClass}">${tagLabel}</span>
    `;
  }
}
