import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyADAJqMyQ0iATzQaNpX0Pc5w7NHx8f2bLU",
    authDomain: "fintrack-expense-app-2026.firebaseapp.com",
    projectId: "fintrack-expense-app-2026",
    storageBucket: "fintrack-expense-app-2026.firebasestorage.app",
    messagingSenderId: "221289392211",
    appId: "1:221289392211:web:9a873b67d4d5aa1ee9bea6",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
