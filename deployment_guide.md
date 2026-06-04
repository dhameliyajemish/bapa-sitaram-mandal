# 🚀 Bapa Sitaram Mandal Management System - Deployment Guide

This guide details how to deploy the Bapa Sitaram Mandal MERN stack application to production.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or sign up.
2. Create a new project and build a **Database Cluster** (Free Tier).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allows connections from anywhere, e.g., Render/Vercel).
5. Go to your Database Cluster dashboard, click **Connect**, choose **Drivers**, and copy the Connection String:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/mandalDB?retryWrites=true&w=majority
   ```

---

## 2. 🖥️ Backend Deployment (Render)

1. Connect your GitHub repository to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Choose your repository.
4. Set the following configurations:
   * **Name**: `bapasitarm-mandal-api`
   * **Root Directory**: `server`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node index.js`
5. Go to the **Environment** tab and add the following variables:
   * `NODE_ENV`: `production`
   * `PORT`: `10000`
   * `MONGO_URI`: `your_mongodb_atlas_connection_string`
   * `JWT_SECRET`: `your_secure_jwt_secret_key`
   * `EMAIL_USER`: `your_gmail_address`
   * `EMAIL_PASS`: `your_gmail_app_password`
6. Deploy the web service and copy the provided Render URL (e.g., `https://bapasitarm-mandal-api.onrender.com`).

---

## 3. 🌐 Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com/) and log in.
2. Click **Add New** -> **Project** and import your repository.
3. In the project config, edit:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. If you have any frontend environment variables (like pointing to the backend Render API URL), you can add them. Or, if the URL is hardcoded in the codebase, update it to point to your Render URL:
   * In `client/src/context/AppDataContext.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Dashboard.jsx`, and `client/src/pages/MonthlyEntry.jsx`, replace `http://localhost:5000` with `https://bapasitarm-mandal-api.onrender.com`.
5. Click **Deploy**. Vercel will host your app and provide a production domain.

---

## 🔄 Updating Server CORS configuration

In `server/index.js`, we have:
```javascript
app.use(cors());
```
This enables all origins by default, making it production-ready to serve requests coming from your Vercel frontend URL.
