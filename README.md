# 🍦 Savaliya Ice Cream POS

Savaliya Ice Cream POS is a premium, modern, and offline-resilient Point of Sale (POS) web application designed specifically for **Savaliya Ice Cream Parlor**. Built with React, TypeScript, and Supabase, it supports offline transaction queueing, cash calculators, custom keyboard shortcuts, receipt printing, and visual sales reports.

---

## 🚀 Key Features

*   **⚡ Branded Checkout Dashboard**: Highly responsive 3-panel billing screen optimized for high-volume transactions with dynamic category/product views.
*   **📂 Multi-Cart State (Hold/Resume)**: Park orders into an offline queue to serve other customers, and resume when they are ready to check out.
*   **💵 Cash Change Calculator**: Get instant return-change calculation with quick-payment buttons (₹100, ₹200, ₹500) and exact total fill.
*   **📶 Offline Queue & Sync**: Continuous operation even during internet outages. Transactions are queued locally in `localStorage` and automatically sync to Supabase when connection restores.
*   **📟 80mm Thermal Receipt Generator**: Print-ready styled invoice modal configured for clean standard receipt paper formatting.
*   **📊 Interactive Analytics**: Visualize sales patterns, top products, and overall performance with Recharts.
*   **🛠️ Menu CRUD Management**: Simple controls to add, edit, or delete categories and products on the fly (restricted to Administrators).
*   **🔒 Supabase Security Policies**: Fully protected tables with Row-Level Security (RLS) policies defining access roles for Cashiers and Admins.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS v4, Lucide React Icons
*   **State Management**: Zustand (Cart & Store configuration)
*   **Server State & Sync**: TanStack React Query (v5)
*   **Charts**: Recharts
*   **Database & Authentication**: Supabase (PostgreSQL + Auth)
*   **Font System**: *Poppins* (headings) & *DM Sans* (body text)

---

## 💻 Getting Started Locally

### 1. Clone the repository
Ensure you have the folder structure on your local environment.

### 2. Set Up Environment Variables
Create a file named `.env` in the root of the project using the structure from `.env.example`:

```ini
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup (Supabase)
1. Go to your [Supabase Console](https://supabase.com).
2. Open the **SQL Editor** in your project database.
3. Paste the contents of `supabase/schema.sql` and run it to create tables, custom types, and enable RLS policies.
4. Paste the contents of `supabase/seed.sql` and run it to populate Categories and Savaliya's signature menu items (Ice Creams, Sundaes, Thick Shakes).

### 4. Create your Admin Account
1. Open Supabase Console -> **Authentication** -> **Users** and add a user manually (or register through the app login page).
2. Go to the Database **Table Editor**, select the `profiles` table, and find the row matching your user ID (`id`).
3. Set the `role` field to `'admin'` to unlock access to the Reports, Settings, and Menu Management dashboards.

### 5. Install Dependencies & Run
Run the following commands in your project root:

```bash
# Install dependencies
npm install

# Start local developer server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Deploy to Vercel

To host this on Vercel:

1. Create a repository on GitHub and push your local files.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your GitHub repository.
4. In the **Environment Variables** section, add:
   *   `VITE_SUPABASE_URL`
   *   `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically compile the Vite code and deploy it globally!
