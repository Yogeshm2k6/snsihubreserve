import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDZ8zynLAsplEtz5w9ZuVjHA-8dotpYWuw",
    authDomain: "snsihub-48206.firebaseapp.com",
    projectId: "snsihub-48206",
    storageBucket: "snsihub-48206.firebasestorage.app",
    messagingSenderId: "666818918105",
    appId: "1:666818918105:web:6b0d0064600c3b9687b0c8",
    measurementId: "G-MCQEHXBQ7Q"
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
