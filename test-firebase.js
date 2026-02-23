import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBlDquM2SYMzQF6OxJqYhEh_34974xWsW8",
    authDomain: "snsihub-96e48.firebaseapp.com",
    projectId: "snsihub-96e48",
    storageBucket: "snsihub-96e48.firebasestorage.app",
    messagingSenderId: "1026657254187",
    appId: "1:1026657254187:web:a395f44d216bf49d8b636e"
};

console.log("Initializing Firebase with config...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testConnection() {
    try {
        console.log("Attempting to connect to Firestore...");
        const snapshot = await getDocs(collection(db, 'users'));
        console.log("Connection successful! Found", snapshot.size, "users.");
        process.exit(0);
    } catch (error) {
        console.error("FIREBASE CONNECTION FAILED:", error);
        process.exit(1);
    }
}

testConnection();
