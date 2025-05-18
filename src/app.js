import { MapService } from './services/MapService.js';
import { NotificationService } from './services/NotificationService.js';
import { Router } from './services/Router.js';
import { indexedDBService } from './services/indexedDB.js';
import { pushNotificationService } from './services/pushNotification.js';

import { StoryModel } from './models/StoryModel.js';
import { UserModel } from './models/UserModel.js';

import { StoryListView } from './views/StoryListView.js';
import { AddStoryView } from './views/AddStoryView.js';
import { AuthView } from './views/AuthView.js';
import { HomeView } from './views/HomeView.js';
import { NotFoundView } from './views/NotFoundView.js';

import { StoryPresenter } from './presenters/StoryPresenter.js';
import { AuthPresenter } from './presenters/AuthPresenter.js';
import { AddStoryPresenter } from './presenters/AddStoryPresenter.js';

import { initializeNotification } from './scripts/notification.js';

if ('serviceWorker' in navigator) {
  let cleanupInterval;
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });

    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.info('ServiceWorker registration successful');

        registration.addEventListener('activate', (event) => {
          event.waitUntil(
            Promise.all([
              caches.delete('blue-geolocation-styles-v1'),
              registration.active.postMessage({ type: 'SKIP_WAITING' }),
            ])
          );
        });

        cleanupInterval = setInterval(() => {
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName !== 'blue-geolocation-styles-v1') {
                  return caches.delete(cacheName);
                }
              })
            );
          });
        }, 3600000);
      })
      .catch((err) => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });

  window.addEventListener('unload', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
  });
}

class App {
  constructor() {
    this.router = new Router();
    this.mapService = new MapService();
    this.notificationService = new NotificationService();

    this.storyModel = new StoryModel();
    this.userModel = new UserModel();

    this.homeView = new HomeView('content');
    this.storyListView = new StoryListView('content');
    this.addStoryView = new AddStoryView('content');
    this.authView = new AuthView('content');
    this.notFoundView = new NotFoundView('content');

    this.storyListView.setMapService(this.mapService);

    this.storyPresenter = new StoryPresenter(
      this.storyModel,
      this.storyListView,
      this.router
    );
    this.addStoryPresenter = new AddStoryPresenter(
      this.addStoryView,
      this.storyModel
    );
    this.authPresenter = new AuthPresenter(
      this.userModel,
      this.authView,
      this.router,
      this.notificationService
    );

    this.addStoryView.setPresenter(this.addStoryPresenter);

    this.initializeApp();
  }

  async initializeApp() {
    // Initialize IndexedDB
    try {
      await indexedDBService.init();
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }

    // Initialize Push Notifications
    try {
      const pushSupported = await pushNotificationService.init();
      if (pushSupported) {
        console.log('Push notifications initialized successfully');
        // Request notification permission when user logs in
        this.userModel.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              await pushNotificationService.subscribeToPushNotifications();
            } catch (error) {
              console.error('Failed to subscribe to push notifications:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }

    this.setupNavigation();
    this.setupRoutes();
    this.updateNavigationState();

    this.authStateListener = () => {
      this.updateNavigationState();
    };
    window.addEventListener('auth-state-changed', this.authStateListener);

    // Inisialisasi notifikasi saat aplikasi dimulai
    document.addEventListener('DOMContentLoaded', () => {
      initializeNotification();
    });
  }

  setupNavigation() {
    const hamburgerButton = document.getElementById('hamburgerButton');
    const navigationDrawer = document.getElementById('navigationDrawer');
    const navList = navigationDrawer.querySelector('ul');

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.className = 'nav-button';
    logoutButton.id = 'logoutButton';

    this.logoutHandler = () => {
      if (confirm('Are you sure you want to logout?')) {
        this.authPresenter.logout();
      }
    };
    logoutButton.addEventListener('click', this.logoutHandler);

    this.logoutButton = logoutButton;

    this.hamburgerHandler = () => {
      navigationDrawer.classList.toggle('open');
    };
    this.documentClickHandler = (e) => {
      if (
        !navigationDrawer.contains(e.target) &&
        !hamburgerButton.contains(e.target)
      ) {
        navigationDrawer.classList.remove('open');
      }
    };

    hamburgerButton.addEventListener('click', this.hamburgerHandler);
    document.addEventListener('click', this.documentClickHandler);
  }

  cleanup() {
    window.removeEventListener('auth-state-changed', this.authStateListener);
    document.removeEventListener('click', this.documentClickHandler);

    const hamburgerButton = document.getElementById('hamburgerButton');
    if (hamburgerButton) {
      hamburgerButton.removeEventListener('click', this.hamburgerHandler);
    }

    if (this.logoutButton) {
      this.logoutButton.removeEventListener('click', this.logoutHandler);
    }

    this.mapService.destroy();
    this.notificationService.cleanup?.();

    // Unsubscribe from push notifications on logout
    if (this.userModel.isUserAuthenticated()) {
      pushNotificationService.unsubscribeFromPushNotifications().catch(console.error);
    }

    this.storyListView.cleanup?.();
    this.addStoryView.cleanup?.();
    this.authView.cleanup?.();
    this.homeView.cleanup?.();
    this.notFoundView.cleanup?.();
  }

  updateNavigationState() {
    const navigationDrawer = document.getElementById('navigationDrawer');
    const navList = navigationDrawer.querySelector('ul');
    const existingLogoutButton = document.getElementById('logoutButton');
    const loginLink = navList.querySelector('a[href="#/login"]');

    if (this.userModel.isUserAuthenticated()) {
      if (!existingLogoutButton) {
        const li = document.createElement('li');
        li.appendChild(this.logoutButton);
        navList.appendChild(li);
      }

      if (loginLink) {
        loginLink.parentElement.remove();
      }
    } else {
      if (existingLogoutButton) {
        existingLogoutButton.parentElement.remove();
      }

      if (!loginLink) {
        const li = document.createElement('li');
        li.innerHTML =
          '<a href="#/login"><i class="fas fa-sign-in-alt"></i> Login</a>';
        navList.appendChild(li);
      }
    }
  }

  setupRoutes() {
    this.router.addRoute('/home', () => {
      this.addStoryView.cleanup();
      this.homeView.render();
    });

    this.router.addRoute('/stories', () => {
      this.addStoryView.cleanup?.();
      this.storyListView.render([]);
      this.storyPresenter.loadStories();
    });

    this.router.addRoute('/add', () => {
      this.addStoryPresenter.initialize();
      this.addStoryView.render();
    });

    this.router.addRoute('/login', () => {
      this.authView.setLoginMode(true);
      this.authView.render();
    });

    this.router.addRoute('/register', () => {
      this.authView.setLoginMode(false);
      this.authView.render();
    });

    // Add not found route
    this.router.setNotFoundRoute(() => {
      this.notFoundView.render();
    });

    const path = this.router.getCurrentPath() || '/home';
    this.router.navigate(path);
  }
}

const app = new App();

window.addEventListener('unload', () => {
  app.cleanup();
});
