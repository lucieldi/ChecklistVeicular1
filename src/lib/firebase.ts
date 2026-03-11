import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD26v9EVZljibvV2vqlWizqVuChKRumyys",
  authDomain: "checklistauto-558e2.firebaseapp.com",
  projectId: "checklistauto-558e2",
  storageBucket: "checklistauto-558e2.firebasestorage.app",
  messagingSenderId: "318214932522",
  appId: "1:318214932522:web:651c4f1d868c45f5ef1b53",
  measurementId: "G-002QXJF28Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db_firebase = getFirestore(app);
export const storage = getStorage(app);
