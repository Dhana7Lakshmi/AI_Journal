/**
 * LifeReel AI - User Authentication State Manager
 */
export class AuthStore {
  constructor() {
    this.userKey = 'lifereel_current_user_v2';
    this.tokenKey = 'lifereel_jwt_token';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Expose local backend securely to the Render frontend via ngrok
    this.baseUrl = isLocal ? 'http://localhost:8000' : 'https://expediter-unpiloted-tidal.ngrok-free.dev';
  }

  _parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  isTokenExpired(token) {
    if (!token) return true;
    const payload = this._parseJwt(token);
    if (!payload || !payload.exp) return true;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return nowSeconds > payload.exp;
  }

  getCurrentUser() {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return JSON.parse(localStorage.getItem(this.userKey)) || null;
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) || null;
  }

  async signup(username, email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorDetail = await response.json().catch(() => ({}));
      throw new Error(errorDetail.detail || `Registration failed with status ${response.status}`);
    }

    return await response.json();
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorDetail = await response.json().catch(() => ({}));
      throw new Error(errorDetail.detail || 'Invalid email or password.');
    }

    const data = await response.json();
    
    // Store token and user session
    localStorage.setItem(this.tokenKey, data.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    
    return data.user;
  }

  logout() {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
  }

  updateProfile(data) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    return updatedUser;
  }

  incrementStreak() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    this.updateProfile({ streak: (currentUser.streak || 0) + 1 });
  }
}

export const auth = new AuthStore();
