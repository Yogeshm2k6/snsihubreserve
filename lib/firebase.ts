/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4hZxbqQa7BGyOL2Ohud1WRg3mz303YEw",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ihub-4faa3.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ihub-4faa3",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ihub-4faa3.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "654157558190",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:654157558190:web:0dcc1dcdd553a42075183f"
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
