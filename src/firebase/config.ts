// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDetFcmQscmAhsuBYL4xubHf9RC5SpTg1U",
  authDomain: "livebus-297d6.firebaseapp.com",
  projectId: "livebus-297d6",
  storageBucket: "livebus-297d6.firebasestorage.app",
  messagingSenderId: "350158451276",
  appId: "1:350158451276:web:afd7e9a6989887dfe77ae9",
  measurementId: "G-SY1ZXQPS1F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const firestoreSettings = {
  experimentalForceLongPolling: true, 
  cacheSizeBytes: 50 * 1024 * 1024, 
};

if (process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export { app, analytics, auth, db, firestoreSettings, storage, functions };