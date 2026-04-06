import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxt-I1Ktw7uPeqYehqW1PH7ybvLvJfssI",
  authDomain: "kidhub-7a207.firebaseapp.com",
  projectId: "kidhub-7a207",
  storageBucket: "kidhub-7a207.firebasestorage.app",
  messagingSenderId: "582197814804",
  appId: "1:582197814804:web:4630dae21c8801f666e901",
  measurementId: "G-HN1LGRV0RY"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
