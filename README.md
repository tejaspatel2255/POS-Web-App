# Universal Point of Sale (POS) Web App (Serverless)

A modern, multi-user, multi-outlet Point of Sale (POS) application built entirely on a serverless architecture using **Vite + React (Frontend)** and **Supabase (Backend/Database)**. Designed to run at 100% zero cost using free tiers.

---

## ✨ Features

- **Auth & Security**: Supabase JWT authentication. Row-level triggers automatically create and link staff profiles on signup. Role-Based Access Control (RBAC) gates administration pages.
- **Implicit Multi-Outlet Scoping**: Every database request is scoped to the user's assigned outlet branch, preventing cashiers from accessing other stores' sales or products.
- **Responsive POS Terminal**:
  - **Desktop**: 2-column sidebar cart layout.
  - **Tablet**: Collapsible rail navigation.
  - **Mobile**: Sticky floating cart drawer sheet (slides up from the bottom), category search navigation, and optimized thumbnail grid touch targets.
- **Unified Responsive Modals**: Shared modal dialogs automatically transform into mobile slide-up sheets for native-app feel.
- **Responsive Dashboard**: Viewport-aware metrics cards (1-col mobile, 2-col tablet, 4-col desktop) and dynamically scaled charts (Recharts) for seamless display across devices.
- **Products & Orders Management**:
  - Automatically transitions from rich desktop tables to responsive card grids on mobile screens.
  - Product stock indicators highlight low inventories.
  - Detailed receipt preview and print logs.
- **Transactions & Refunds**: Date-range transaction log with cashier receipt viewing. Voiding and refund actions automatically restore product quantities and update customer points.
- **Inventory Control**: Real-time stock status tracking, low stock highlights, and inter-branch stock transfers.
- **Branch Configuration**: Settings panel to manage outlets, users/roles, tax rates, discount rules, payment channels, and cash drawer shifts.

---

## 🛠️ Tech Stack

- **Frontend/App**: React.js, Tailwind CSS (v4), Zustand (state management), Lucide Icons, Recharts, Vite.
- **Database & Auth**: Supabase (PostgreSQL, Realtime, Auth).
- **Deployment**: Vercel.

---

## ⚙️ Setup Instructions

### 1. Initialize Supabase Database Schema
1. Log into your **[Supabase Dashboard](https://supabase.com)** and open your project.
2. Go to the **SQL Editor** on the left menu.
3. Click **New query** and paste the database schema SQL scripts.
4. Click **Run** to execute the script. This creates all tables, constraints, initial payment/tax seeds, and the automatic signup trigger.

### 2. Configure Client Environment (`client/.env`)
Create a `.env` file inside the `client/` directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Locally
```bash
cd client
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## ☁️ Deployment Guide (Vercel)

1. Go to **[Vercel.com](https://vercel.com/)** and log in using your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your repository.
4. On the configuration page:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select **`client`**
5. Add your **Environment Variables** in Vercel:
   - `VITE_SUPABASE_URL` = *(Your Supabase URL)*
   - `VITE_SUPABASE_ANON_KEY` = *(Your Supabase Anon Key)*
6. Click **Deploy**.
