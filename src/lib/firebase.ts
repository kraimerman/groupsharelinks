import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBo-63qKqqvVoHPjW7ufASZ_TRzE5pAjGg",
  authDomain: "groupchat-85e9f.firebaseapp.com",
  projectId: "groupchat-85e9f",
  storageBucket: "groupchat-85e9f.firebasestorage.app",
  messagingSenderId: "101076585018",
  appId: "1:101076585018:web:ec85c0ceb8069b22850303",
  measurementId: "G-EFS82LNW3G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);