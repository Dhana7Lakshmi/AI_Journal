/**
 * LifeReel AI - LoginPage View
 */
import { auth } from '../utils/auth.js';

export class LoginPage {
  render() {
    const container = document.createElement('div');
    container.className = 'page-view auth-container';

    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <h2>Sign In</h2>
          <p>Sign in to access your memory diary</p>
        </div>

        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="user@lifereel.ai" required />
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required />
          </div>

          <div class="form-options">
            <label>
              <input type="checkbox" id="login-remember" />
              <span>Remember Me</span>
            </label>
            <a href="#forgot" id="btn-forgot-pw">Forgot Password?</a>
          </div>

          <div id="login-error" style="color: #ff3333; font-size: 0.85rem; display: none;"></div>

          <button type="submit" class="btn-auth-submit">Sign In</button>
        </form>

        <div class="auth-footer">
          <p>New to LifeReel? <a href="#signup">Create an Account</a></p>
        </div>
      </div>
    `;

    const form = container.querySelector('#login-form');
    const emailInput = container.querySelector('#login-email');
    const passwordInput = container.querySelector('#login-password');
    const errorDiv = container.querySelector('#login-error');
    const forgotPw = container.querySelector('#btn-forgot-pw');

    forgotPw.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Mock Password Reset: Use credentials "user@lifereel.ai" and "password" to log in.');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.style.display = 'none';

      try {
        await auth.login(emailInput.value.trim(), passwordInput.value);
        // Dispatch global login event so navbar/sidebar updates
        window.dispatchEvent(new CustomEvent('auth-change'));
        window.location.hash = '#timeline';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      }
    });

    return container;
  }

  onMount() {}
}
