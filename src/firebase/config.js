// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBxKKySdOL37KKN8svhPJxXrKzpFEkIkV8",
    authDomain: "vjlf-3fd90.firebaseapp.com",
    projectId: "vjlf-3fd90",
    storageBucket: "vjlf-3fd90.firebasestorage.app",
    messagingSenderId: "939200869442",
    appId: "1:939200869442:web:10302ac1e2ce67da0529db",
    measurementId: "G-HDQ6MXJW0B"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };