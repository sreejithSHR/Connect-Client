import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIRq5MxhZlVrbPULswD3ifVZjVsivx7NY",
  authDomain: "edustax-connect.firebaseapp.com",
  projectId: "edustax-connect",
  storageBucket: "edustax-connect.firebasestorage.app",
  messagingSenderId: "781939979875",
  appId: "1:781939979875:web:e869b5db9df73e9392aa56",
  measurementId: "G-7K5KLW0M4B"// your firebase config
};

const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);
const auth = getAuth(app);

export { auth, firestore };
