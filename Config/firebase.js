import admin from "firebase-admin";

const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID?.trim().replace(/"/g, ''),
    client_email: process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/"/g, ''),
    private_key: process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/"/g, '').replace(/\\n/g, '\n'),
};

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };