// Meminta izin notifikasi
async function requestNotificationPermission() {
  try {
    const result = await Notification.requestPermission();
 
    if (result === 'denied') {
      console.log('Izin notification ditolak.');
      return false;
    }
 
    if (result === 'default') {
      console.log('Izin notification ditutup atau diabaikan.');
      return false;
    }
 
    console.log('Izin notification diterima');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Menampilkan notifikasi melalui UI thread
function showNotification(title, options = {}) {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else {
      console.log('Izin notification belum diberikan');
    }
  } else {
    console.log('Browser tidak mendukung Notification API');
  }
}

// Menampilkan notifikasi melalui Service Worker
async function showNotificationWithServiceWorker(title, options = {}) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Inisialisasi notifikasi
async function initializeNotification() {
  if ('Notification' in window) {
    const permission = await requestNotificationPermission();
    if (permission) {
      // Contoh penggunaan notifikasi
      const title = 'Todo Baru telah ditambahkan!';
      const options = {
        body: 'Segera selesaikan sebelum tanggal 12 Desember 2025.',
        icon: '/images/icon-72.png',
        badge: '/images/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        },
        actions: [
          {
            action: 'explore',
            title: 'Lihat Detail',
            icon: '/images/icon-72.png'
          }
        ]
      };

      // Tampilkan notifikasi melalui Service Worker
      await showNotificationWithServiceWorker(title, options);
    }
  }
}

export { initializeNotification, showNotification, showNotificationWithServiceWorker }; 