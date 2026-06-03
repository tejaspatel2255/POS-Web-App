# 🚀 Universal Multi-Tenant SaaS POS Platform

A state-of-the-art, premium multi-tenant Point of Sale (POS) SaaS platform designed for modern business operations. Built with React 18, TypeScript, Tailwind CSS, Vite, Supabase (with Row-Level Security), Zustand, and TanStack Query. It features a complete offline sync engine with IndexedDB and a Service Worker for offline resilience.

---

## 🌟 Premium Features

### 🏢 Multi-Tenant Workspace Architecture
- **Onboarding Flow**: Register, create multiple store workspaces, or join existing stores via invites.
- **Store-Specific Subdomains/Identifiers**: Scopes all categories, products, orders, settings, and staff roster under the selected active store.
- **Data Isolation**: Enforced via Supabase PostgreSQL Row Level Security (RLS) policies.

### ⚡ Responsive POS Billing Workspace
- **3-Panel Billing Grid**: Vertical category filters, quick product touch tiles, and interactive cart controller.
- **Dynamic Order Types**: Walk-In, Dine-In, Takeaway, Parcel, and Delivery. Supports enabling/disabling types via store settings.
- **Offline Mode**: Local order queuing using IndexedDB, product/category catalog caching, and automatic upload synchronization on network restore.
- **Invoice & Thermal Printing**: 80mm styled receipt modal with browser printing and WhatsApp receipt sharing.

### 🎨 Brand & Color Customization
- **Theme Variables**: Store owners can choose a custom brand theme color (6 presets or custom HEX color). The app shell dynamically injects the color variables into Tailwind.
- **Store Metadata**: Displays store logo, tagline, address, phone number, and custom currency symbols (e.g. ₹, $, €) derived directly from store profile.

### 🔒 Enterprise Role-Based Access Control (RBAC)
- **Owner**: Absolute controls. Can update store settings, configure order types, modify billing currencies, and hire/deactivate staff.
- **Admin**: Can manage categories and products (CRUD), view transaction records, and run reports.
- **Cashier**: Access limited to the POS billing workspace and viewing their own completed orders.

### 📊 Real-Time Operations & Dashboard
- **Operational Metrics**: Real-time sales indicators (Today's Sales, Orders Count, Pending, On Hold) updated instantly using Supabase real-time channel subscriptions.
- **Checklist**: Guided onboarding indicators for new store workspaces.
- **Business Reporting**: Interactive charts (Recharts Bar & Pie charts) analyzing daily sales history and category revenues.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & Icons**: Tailwind CSS, Lucide Icons, Poppins & DM Sans Typography
- **Client State**: Zustand (Cart stores, Auth workspaces)
- **Data Synchronization**: TanStack React Query (v5)
- **Offline Storage**: IndexedDB (using `idb`), Cache Storage Service Worker (PWA manifest)
- **Analytics Charts**: Recharts
- **Database Backend**: Supabase (Postgres, Auth, RLS Policies, Database Functions)

---

## 💻 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd universal-pos
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Migration Setup
1. Log in to your [Supabase Console](https://supabase.com).
2. Open the **SQL Editor** in your database workspace.
3. Copy the contents of `supabase/001_universal_pos.sql` and run the script. This creates:
   - Tables (`stores`, `store_members`, `categories`, `products`, `orders`, `order_items`, `store_settings`).
   - RLS security policies restricting data to authenticated members.
   - Core functions (`get_user_store_role`, `store_has_members`).

### 4. Running the Application
```bash
# Start local Vite development server
npm run dev

# Build for production distribution (PWA enabled)
npm run build
```
---

## 📶 Offline & Sync Mechanism

1. **Pre-Caching**: A custom Service Worker (`public/sw.js`) intercepts and caches critical static assets, pages, and Supabase REST query requests for offline resilience.
2. **Catalog Fallbacks**: The application pulls and caches all category and product schema structures inside local IndexedDB storage. If a cashier goes offline, the POS switches transparently to local cached structures to allow continued search and checkouts.
3. **Double-Ended Sync Engine**: 
   * Offline checkout saves orders to a pending object store in IndexedDB.
   * Client-side identifiers are generated using the native browser Web Crypto API `crypto.randomUUID()` to prevent ID conflicts.
   * An `<OfflineBanner />` component polls pending queues, shows a live count of unsynced items, and automatically triggers background uploads via `syncPendingOrders()` the moment internet connection is restored.
   * Synced records are cleanly purged from the local database queue upon successful insertion into Supabase.

---

## 🛡️ License

This project is licensed under the MIT License.
