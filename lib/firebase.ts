/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZ8zynLAsplEtz5w9ZuVjHA-8dotpYWuw",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "snsihub-48206.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "snsihub-48206",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "snsihub-48206.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "666818918105",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:666818918105:web:6b0d0064600c3b9687b0c8"
};

// Initialize Firebase safely
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

// Initialize Cloud Messaging and get a reference to the service
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const storage = getStorage(app);

export const requestNotificationPermission = async () => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (!vapidKey || vapidKey === 'replace_with_your_generated_vapid_key') {
                console.warn('VAPID key not configured. FCM tokens cannot be generated.');
                return null;
            }
            const currentToken = await getToken(messaging, { vapidKey });
            if (currentToken) {
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        return null;
    }
};

if (messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        // You can also use react-hot-toast here if you want to show foreground toasts for pushes!
    });
}
