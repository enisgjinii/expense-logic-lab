// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyD6XRQs3kci2e53an5MVc7ZuAItjjqiwBg",
  authDomain: "expensesecond-1bcb8.firebaseapp.com",
  projectId: "expensesecond-1bcb8",
  storageBucket: "expensesecond-1bcb8.firebasestorage.app",
  messagingSenderId: "923984566990",
  appId: "1:923984566990:web:c70448f9d8b0501aff0e9f",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
