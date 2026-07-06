/**
 * LifeReel AI - SignupPage View
 */
import { auth } from '../utils/auth.js';

export class SignupPage {
  render() {
    const container = document.createElement('div');
    container.className = 'page-view auth-container';

    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p>Create your digital memory diary account</p>
        </div>

        <form class="auth-form" id="signup-form">
          <div class="form-group">
            <label for="signup-username">Username</label>
            <input type="text" id="signup-username" class="form-control" placeholder="SweetJournaler" required />
          </div>

          <div class="form-group">
            <label for="signup-email">Email Address</label>
            <input type="email" id="signup-email" class="form-control" placeholder="explorer@lifereel.ai" required />
          </div>

          <div class="form-group">
            <label for="signup-password">Secure Password</label>
            <input type="password" id="signup-password" class="form-control" placeholder="••••••••" required />
          </div>

          <div class="form-group">
            <label for="signup-confirm">Confirm Password</label>
            <input type="password" id="signup-confirm" class="form-control" placeholder="••••••••" required />
          </div>

          <div id="signup-error" style="color: #ff3333; font-size: 0.85rem; display: none;"></div>

          <button type="submit" class="btn-auth-submit">Create Account</button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a href="#login">Sign In</a></p>
        </div>
      </div>
    `;

    const form = container.querySelector('#signup-form');
    const usernameInput = container.querySelector('#signup-username');
    const emailInput = container.querySelector('#signup-email');
    const passwordInput = container.querySelector('#signup-password');
    const confirmInput = container.querySelector('#signup-confirm');
    const errorDiv = container.querySelector('#signup-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.style.display = 'none';

      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;

      if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.style.display = 'block';
        return;
      }

      try {
        await auth.signup(username, email, password);
        alert('Signup successful! Please sign in with your credentials.');
        window.location.hash = '#login';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      }
    });

    return container;
  }

  onMount() {}
}
