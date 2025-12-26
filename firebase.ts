
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAzC00FcimxmzP0h2WBjnwCJNMjclTGMk0",
    authDomain: "svga-enius.firebaseapp.com",
    projectId: "svga-enius",
    storageBucket: "svga-enius.firebasestorage.app",
    messagingSenderId: "128344178032",
    appId: "1:128344178032:web:bd3716339214928d8363b5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
