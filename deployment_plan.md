# Deployment Plan 🚀

This guide provides step-by-step instructions for deploying your system to a production environment.

## 1. Backend Deployment (Node.js)
The backend requires a platform that supports background timers (`setInterval`). We recommend **Railway** or **Render**.

### Steps for [Railway.app](https://railway.app):
1.  **Connect GitHub**: Create a new project and link your backend repository.
2.  **Environment Variables**: Go to the **Variables** tab and add everything from your `.env` file:
    - `PORT=8000`
    - `FIREBASE_CLIENT_EMAIL`
    - `FIREBASE_PRIVATE_KEY` (Ensure it's the full key with `\n` preserved)
    - `ADMIN_USER` / `ADMIN_PASS` (For Dashboard login)
    - `FIREBASE_SERVICE_ACCOUNT_KEY` (Wait—use the individual variables instead for safety)
3.  **Root Directory**: Set the root directory to `Backend/`.
4.  **Start Command**: `npm install && npm run start`.

---

## 2. Frontend Deployment (React + Vite)
The frontend can be hosted for free on **Vercel** or **Netlify**.

### Steps for [Vercel.com](https://vercel.com):
1.  **Import Repo**: Connect your GitHub and select the project.
2.  **Framework Preset**: Select **Vite**.
3.  **Environment Variables**:
    - `VITE_API_BASE_URL`: Set this to your **Railway Backend URL** (e.g., `https://backend-production.up.railway.app`).
4.  **Deploy**: Hit deploy. It will automatically build and host.

---

## 3. Google Sheets & Firebase Access
1.  **Production URL**: Once your frontend is deployed, add its URL to the **Firebase Authentication Authorized Domains** and **CORS settings** in the backend if needed (though our backend uses `*` for now).
2.  **Service Account**: Ensure your Google Service Account email still has **Editor** access to any new sheets you create.

## 4. Maintenance & Scalability
- **Adding New Sheets**: Simply add a new document to the `repositories` collection in Firestore. Thanks to our latest "Dynamic Sync" update, the backend will automatically detect it and sync without any code changes!
