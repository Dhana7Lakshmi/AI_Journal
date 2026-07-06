/**
 * LifeReel AI - SPA Core Router & Application Bootstrapper
 * Configured with Floating Bottom Bubble Tabs and Spiral Notebook Layouts.
 */
import { auth } from './utils/auth.js';
import { Navbar } from './components/Navbar.js';

// Import Page Views
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { RecordMemoryPage } from './pages/RecordMemoryPage.js';
import { ProcessingPage } from './pages/ProcessingPage.js';
import { GeneratedMemoryPage } from './pages/GeneratedMemoryPage.js';
import { TimelinePage } from './pages/TimelinePage.js';
import { MemoryDetailsPage } from './pages/MemoryDetailsPage.js';
import { WeeklyRewindPage } from './pages/WeeklyRewindPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { CapsulesPage } from './pages/CapsulesPage.js';

const routes = {
  '#home': HomePage,
  '#login': LoginPage,
  '#signup': SignupPage,
  '#record': RecordMemoryPage,
  '#processing': ProcessingPage,
  '#generated': GeneratedMemoryPage,
  '#timeline': TimelinePage,
  '#details': MemoryDetailsPage,
  '#rewind': WeeklyRewindPage,
  '#analytics': AnalyticsPage,
  '#profile': ProfilePage,
  '#settings': SettingsPage,
  '#capsules': CapsulesPage
};

class App {
  constructor() {
    this.container = document.getElementById('app-mount');
    this.activePage = null;
    this.navFactory = new Navbar();
  }

  init() {
    // Bind route changes
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('DOMContentLoaded', () => this.route());
    window.addEventListener('auth-change', () => this.route());
  }

  route() {
    let rawHash = window.location.hash || '#home';
    
    // Strip query parameters
    let matchedHash = rawHash;
    if (rawHash.includes('?')) {
      matchedHash = rawHash.substring(0, rawHash.indexOf('?'));
    }

    // Fallback
    let PageClass = routes[matchedHash];
    if (!PageClass) {
      window.location.hash = '#home';
      return;
    }

    // Authentication Guard
    const user = auth.getCurrentUser();
    const guestPages = ['#home', '#login', '#signup'];
    const isGuestPage = guestPages.includes(matchedHash);

    if (!user && !isGuestPage) {
      window.location.hash = '#login';
      return;
    }

    if (user && (matchedHash === '#login' || matchedHash === '#signup')) {
      window.location.hash = '#timeline';
      return;
    }

    // Clean up active running loops
    if (this.activePage && typeof this.activePage.destroy === 'function') {
      this.activePage.destroy();
    }

    // Instantiate new Page
    this.activePage = new PageClass();
    const pageNode = this.activePage.render();

    // Render global layout shell
    this.container.innerHTML = '';

    // Floating Bottom Tab Bar Navigation (Rendered globally for all pages)
    const navNode = this.navFactory.render(matchedHash);
    this.container.appendChild(navNode);

    // Notebook Lined Paper Sheet Wrapper (Only for internal dashboard views)
    const isDashboardView = user && !isGuestPage && matchedHash !== '#processing';
    
    if (isDashboardView) {
      const notebookContainer = document.createElement('div');
      notebookContainer.className = 'page-view';
      notebookContainer.style.maxWidth = '1000px';

      const notebookSheet = document.createElement('div');
      notebookSheet.className = 'notebook-sheet';

      const contentLines = document.createElement('div');
      contentLines.className = 'notebook-content-lines';
      contentLines.appendChild(pageNode);

      notebookSheet.appendChild(contentLines);
      notebookContainer.appendChild(notebookSheet);

      const mainWrapper = document.createElement('main');
      mainWrapper.appendChild(notebookContainer);
      this.container.appendChild(mainWrapper);
    } else {
      // Clean full-viewport layout for home landing, logins, and loading gates
      const mainWrapper = document.createElement('main');
      mainWrapper.appendChild(pageNode);
      this.container.appendChild(mainWrapper);
    }

    // Hook lifecycle mount events
    if (typeof this.activePage.onMount === 'function') {
      this.activePage.onMount();
    }

    // Auto scroll
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

const app = new App();
app.init();
