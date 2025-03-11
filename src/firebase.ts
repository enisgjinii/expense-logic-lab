// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBxkQbQELpFSofoJHM9GiuxpvdEQm0mwnI',
  authDomain: 'expense-app-97804.firebaseapp.com',
  projectId: 'expense-app-97804',
  storageBucket: 'expense-app-97804.firebasestorage.app',
  messagingSenderId: '926227984603',
  appId: '926227984603:web:8d837d0643b2355d311cfe',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
