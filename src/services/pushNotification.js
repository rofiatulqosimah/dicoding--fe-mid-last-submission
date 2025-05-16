// VAPID keys should be obtained from your server
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

class PushNotificationService {
  constructor() {
    this.serviceWorkerRegistration = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribeToPushNotifications() {
    try {
      const permission = await this.requestNotificationPermission();
      if (!permission) {
        throw new Error('Notification permission denied');
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to your server
      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications() {
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify your server about the unsubscription
        await this.removeSubscriptionFromServer(subscription);
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to your server
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      return response.json();
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from your server
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      return response.json();
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService(); 