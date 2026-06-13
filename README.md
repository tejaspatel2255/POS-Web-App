# Savaliya Universal Point of Sale (POS) Web App

A modern, multi-user, multi-outlet MERN stack Point of Sale (POS) application integrated with Supabase Authentication, designed to run entirely on free-tier services.

---

## ✨ Features

- **Auth & Security**: Supabase JWT authentication synced with MongoDB records. Implicit multi-outlet scoping prevents staff members from viewing or altering data outside their assigned branch. Role-Based Access Control (RBAC) gates administration functions.
- **POS Terminal**: Live checkout shopping basket with category pills and SKU search. Stock-aware inventory (prevents checkouts of out-of-stock items), loyalty point calculation, fixed/percentage discounts, split payment options, and invoice printing templates.
- **Transactions & Refunds**: Date-range transaction log with inline cashier receipt viewing. Manager-gated voiding and refunds logic that restores product quantities.
- **Inventory Control**: Real-time stock status tracking, low stock highlights, and inter-branch stock transfers.
- **Analytics & Valuation**: Gross revenue charts, net profit dashboards, average order calculations, and detailed printable inventory valuation forms.
- **Branch Configuration**: Settings panel to manage branches, users/roles, tax rates, discount rules, payment channels, and cash drawer shifts.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS (v4), Zustand (state management), Lucide Icons, Recharts, Vite (bundler).
- **Backend**: Node.js, Express.js, Mongoose/MongoDB (data storage), Supabase Auth (JWT generation).
- **Deployment**: Vercel (Frontend), Render/Railway/Heroku (Backend).

---

## ⚙️ Environment Configuration

### Backend Environment (`server/.env`)
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/universal-pos
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend Environment (`client/.env`)
Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 Running Locally

### 1. Run the Express Backend
```bash
cd server
npm install
npm run dev
```

### 2. Run the React Frontend
```bash
cd client
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## ☁️ Deployment Guide

### 1. Frontend: Deploying to Vercel
1. Install Vercel CLI globally or use the Vercel Dashboard.
2. Link your GitHub repository to Vercel.
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Configure the environment variables on Vercel:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://your-backend.onrender.com`).
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
5. Deploy.

### 2. Backend: Deploying to Render / Railway
1. Push your server directory contents to a repository.
2. Set the start command to `npm start`.
3. Add the environmental variables:
   - `MONGODB_URI`: Production MongoDB Atlas URI.
   - `SUPABASE_JWT_SECRET`: Production Supabase JWT Secret.
   - `CLIENT_URL`: Your deployed Vercel domain (for CORS configurations).
