importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// We configure firebase here to allow the service worker to receive messages in the background.
// Note: We'll need the user to paste their config here eventually, or we inject it at build time.
// Since Service Workers don't have access to process.env in Vite, we usually use URL params or hardcode.
// For now, we'll try to listen to the push event generically. 

firebase.initializeApp({
    apiKey: "AIzaSyA4hZxbqQa7BGyOL2Ohud1WRg3mz303YEw",
    authDomain: "ihub-4faa3.firebaseapp.com",
    projectId: "ihub-4faa3",
    storageBucket: "ihub-4faa3.firebasestorage.app",
    messagingSenderId: "654157558190",
    appId: "1:654157558190:web:0dcc1dcdd553a42075183f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/vite.svg', // Replace with your app logo
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
