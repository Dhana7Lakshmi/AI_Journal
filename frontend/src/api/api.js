/**
 * LifeReel AI - Core API Layer
 * Connects the vanilla JS frontend with the FastAPI backend endpoints.
 */

export class LifeReelAPI {
  constructor() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Expose local backend securely to the Render frontend via ngrok
    this.baseUrl = isLocal ? 'http://localhost:8000' : 'https://expediter-unpiloted-tidal.ngrok-free.dev';
  }

  /**
   * Helper to retrieve headers with Authorization token.
   */
  _getHeaders(additionalHeaders = {}) {
    const token = localStorage.getItem('lifereel_jwt_token');
    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...additionalHeaders
    };
  }

  /**
   * Internal fetch wrapper that checks for 401 Unauthorized status.
   */
  async _fetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
      localStorage.removeItem('lifereel_jwt_token');
      localStorage.removeItem('lifereel_current_user_v2');
      window.dispatchEvent(new CustomEvent('auth-change'));
      window.location.hash = '#login';
      throw new Error('Session expired. Please log in again.');
    }
    return response;
  }

  /**
   * Uploads recorded audio and runs the full AI processing pipeline.
   * @param {Blob} audioBlob - The recorded voice entry.
   * @returns {Promise<Object>} The created MemoryResponse payload.
   */
  async createMemory(audioBlob) {
    const formData = new FormData();
    const extension = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'wav';
    formData.append('audio', audioBlob, `voice_entry.${extension}`);

    const response = await this._fetch(`${this.baseUrl}/api/memory/create`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Uploads audio blob and transcribes it locally on the backend.
   * @param {Blob} audioBlob - The recorded voice entry.
   * @returns {Promise<Object>} Object containing the transcription text.
   */
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    const extension = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'wav';
    formData.append('file', audioBlob, `voice_entry.${extension}`);

    const response = await this._fetch(`${this.baseUrl}/api/entries/transcribe`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Transcription Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generates a text-only journal entry and processes it.
   * @param {string} rawText - The typed entry text.
   * @returns {Promise<Object>} The created DiaryResponse payload.
   */
  async generateEntry(rawText) {
    const response = await this._fetch(`${this.baseUrl}/api/entries/generate`, {
      method: 'POST',
      headers: this._getHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ raw_text: rawText }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetches all persisted memories from the backend, sorted newest first.
   * @returns {Promise<Array>} List of timeline memories.
   */
  async getTimeline() {
    const response = await this._fetch(`${this.baseUrl}/api/entries/timeline`, {
      headers: this._getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch timeline: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.timeline || [];
  }

  /**
   * Fetches details of a single memory or diary entry.
   * @param {string} id - Stringified MongoDB ObjectID of the entry.
   * @returns {Promise<Object>} DiaryResponse or MemoryResponse payload.
   */
  async getEntry(id) {
    const response = await this._fetch(`${this.baseUrl}/api/entries/${id}`, {
      headers: this._getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch entry: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Deletes a single memory or diary entry from the database.
   * @param {string} id - Stringified MongoDB ObjectID.
   * @returns {Promise<Object>} Status response.
   */
  async deleteEntry(id) {
    const response = await this._fetch(`${this.baseUrl}/api/entries/${id}`, {
      method: 'DELETE',
      headers: this._getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to delete entry: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Generates artwork based on transcript and mood.
   * @param {string} transcript - The diary entry text.
   * @param {string} mood - The emotion/mood.
   * @returns {Promise<string>} Resolved URL to the generated image.
   */
  async generateArtwork(transcript, mood) {
    const response = await this._fetch(`${this.baseUrl}/api/entries/generate-artwork`, {
      method: 'POST',
      headers: this._getHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ transcript, mood }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    const data = await response.json();
    const url = data.image_url;
    return url ? (url.startsWith('http') ? url : `${this.baseUrl}${url}`) : '';
  }

  /**
   * Creates a memory using a custom FormData payload (multipart/form-data).
   * @param {FormData} formData - The populated form data.
   * @returns {Promise<Object>} The created entry document.
   */
  async createMemoryMultipart(formData) {
    const response = await this._fetch(`${this.baseUrl}/api/memory/create`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetches all Future Capsules for the current user.
   * @returns {Promise<Array>}
   */
  async getCapsules() {
    const response = await this._fetch(`${this.baseUrl}/api/capsules`, {
      method: 'GET',
      headers: this._getHeaders(),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetches a single Future Capsule by ID.
   * @param {string} capsuleId
   * @returns {Promise<Object>}
   */
  async getCapsule(capsuleId) {
    const response = await this._fetch(`${this.baseUrl}/api/capsules/${capsuleId}`, {
      method: 'GET',
      headers: this._getHeaders(),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Creates a new Future Capsule.
   * @param {FormData} formData
   * @returns {Promise<Object>}
   */
  async createCapsule(formData) {
    const response = await this._fetch(`${this.baseUrl}/api/capsules`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorDetail || response.statusText}`);
    }

    return await response.json();
  }
}

// Export a singleton instance under the legacy name for seamless compatibility
export const intelApi = new LifeReelAPI();
export const moodMapping = {
  Calm: { tag: '🌸 Soothing Wave', color: 'var(--mood-calm)' },
  Nostalgic: { tag: '🧸 Warm Hug', color: 'var(--mood-nostalgic)' },
  Inspired: { tag: '✨ Sparkle Dust', color: 'var(--mood-inspired)' },
  Grateful: { tag: '💖 Sweet Heart', color: 'var(--mood-grateful)' },
  Joyful: { tag: '☀️ Happy Sunshine', color: 'var(--mood-joyful)' }
};

export function normalizeMood(rawMood) {
  if (!rawMood) return 'Calm';
  const mood = String(rawMood).trim().toLowerCase();
  if (mood === 'joy' || mood === 'joyful') return 'Joyful';
  if (mood === 'melancholy' || mood === 'nostalgic') return 'Nostalgic';
  if (mood === 'productive' || mood === 'inspired') return 'Inspired';
  if (mood === 'grateful') return 'Grateful';
  if (mood === 'calm') return 'Calm';
  return 'Calm'; // default fallback
}

