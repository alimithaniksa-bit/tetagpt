import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";

// Config matches firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAcw1dHXKOsABefkzTVjBjaWA9MQEPOVzQ",
  authDomain: "tetagpt.firebaseapp.com",
  projectId: "tetagpt",
  storageBucket: "tetagpt.firebasestorage.app",
  messagingSenderId: "1079040208954",
  appId: "1:1079040208954:web:c5bfcf0d9037feef848503"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if available
const firestoreDatabaseId = "ai-studio-tetagpt-13f894e1-ef44-4766-916c-f558f3113d96";
const db = getFirestore(app, firestoreDatabaseId);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  // Firestore exports
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp
};
