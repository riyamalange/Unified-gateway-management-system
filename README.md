# UNIPAY – Unified Payment Gateway

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Tailwind%20CSS-61DAFB.svg)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express%20%7C%20Spring%20Boot-6DB33F.svg)](https://spring.io/projects/spring-boot)
[![Database](https://img.shields.io/badge/Database-MySQL%208.x-4479A1.svg)](https://www.mysql.com)

**UNIPAY** is an enterprise-grade Unified Payment Gateway and routing platform. It connects customers, merchants, and administrators through a resilient payment middleware that dynamically routes transactions across multiple gateways (Razorpay, Stripe, PayPal, and PayU) while maintaining strict relational audit tracking, automated settlement calculations, customer refund workflows, and secure authentication.

---

## 🌟 Key Features

### 1. Unified Gateway Routing
- **Multi-Gateway Support**: Dynamically routes customer payments through active gateways (**Razorpay**, **Stripe**, **PayPal**, **PayU**).
- **Payment Methods**: Supports UPI, Credit/Debit Cards, Net Banking, and Digital Wallets.
- **Failover & Availability**: Automatically skips inactive/disabled payment gateways with graceful fallback handling.

### 2. Multi-Role Portals
- 👤 **Customer / User Portal**:
  - Secure payments with instant transaction confirmation.
  - Detailed payment history with status badges (`SUCCESS`, `PENDING`, `FAILED`, `REFUNDED`).
  - **Refund Request System**: Customers can submit refund requests (`Order cancelled`, `Duplicate payment`, `Payment issue`, `Other`) for eligible transactions.
  - Dashboard analytics: Total Payments, Successful Payments, Pending Payments, and Total Spent.
- 🏪 **Merchant Portal** (e.g., FoodFast, ShopKart, TicketGo):
  - View real-time transactions with customer info, payment methods, and gateways.
  - **Refund Management**: Review, approve (`PENDING` → `COMPLETED`), or reject customer refund requests.
  - **Settlements & Payouts**: Automated gross revenue tracking, UNIPAY platform fee deduction (2.2%), and net merchant payouts.
  - Financial transparency: Merchant view reflects the original transaction amount paid by the customer.
- 🛡️ **Admin Console**:
  - Global overview of merchants, active gateways, transactions, refunds, and financial performance.
  - System-wide revenue calculations: Gross Payment Volume (GPV), UNIPAY Platform Revenue, and Merchant Settlements.
  - Gateway management: Toggle gateway status (`ACTIVE` / `INACTIVE`) and adjust processing fee percentages.

### 3. Security & Authentication
- Role-based access control (RBAC): `CUSTOMER`, `MERCHANT`, and `ADMIN`.
- **Suggest Password Generator**: Built-in 12-character high-entropy password generator (uppercase, lowercase, numbers, and symbols) that auto-populates and validates both password and confirm-password fields with one-click copy and visibility toggles.
- Strict backend validation:
  - Verification of transaction ownership and status prior to refund initiation.
  - Refund amount capped at the original transaction total.
  - Prevention of unauthorized cross-account refund requests.

---

## 🏛️ System Architecture

```text
               ┌───────────────────────────────┐
               │    Customer / Merchant /      │
               │        Admin Dashboards       │
               │   (React SPA / Vite Tailwind) │
               └───────────────┬───────────────┘
                               │ HTTP / REST
                               ▼
               ┌───────────────────────────────┐
               │      UNIPAY Middleware API    │
               │   (Node.js / Express / Spring)│
               └───────┬───────────────┬───────┘
                       │               │
        Routing Engine ▼               ▼ Relational Audit
          ┌────────────────────┐     ┌──────────────────────┐
          │  Payment Gateways  │     │   MySQL 8.x Engine   │
          │  - Razorpay        │     │  - users             │
          │  - Stripe          │     │  - merchants         │
          │  - PayPal          │     │  - payment_gateways  │
          │  - PayU            │     │  - transactions      │
          └────────────────────┘     │  - settlements       │
                                     │  - refunds           │
                                     └──────────────────────┘
```

---

## 📁 Repository Structure

```text
├── database/
│   └── unipay.sql             # Complete MySQL 8.x schema, indexes, constraints & seed data
├── src/                       # React 19 single-page application
│   ├── App.tsx                # Unified customer, merchant, and admin portal UI
│   ├── main.tsx               # Application bootstrap
│   └── index.css              # Global styling with Tailwind CSS
├── server.ts                  # Node.js / Express full-stack API server & gateway proxy
├── unipay-backend/            # Java Spring Boot reference backend
│   ├── pom.xml                # Maven project definition and dependencies
│   └── src/                   # Spring Boot controllers, entities, and repositories
├── unipay-frontend/           # Standalone static web frontend assets
│   ├── index.html             # Customer dashboard
│   ├── merchant.html          # Merchant dashboard
│   ├── admin.html             # Admin console
│   ├── login.html             # Login page
│   ├── signup.html            # Registration page with Suggest Password tool
│   ├── js/                    # Client-side JavaScript (auth, dashboard, payments)
│   └── css/                   # Stylesheets
├── package.json               # Node.js dependencies and run scripts
├── metadata.json              # AI Studio project metadata and capabilities
└── tsconfig.json              # TypeScript compilation configuration
```

---

## 🗄️ Database Schema Overview

The database uses relational integrity with foreign key constraints in InnoDB:

| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `users` | Customer profiles & credentials | `user_id`, `name`, `email`, `password`, `role` |
| `merchants` | Client businesses integrated with UNIPAY | `merchant_id`, `merchant_code`, `name`, `email`, `api_key`, `status` |
| `payment_gateways` | Payment providers & dynamic routing status | `gateway_id`, `name`, `code`, `status`, `fee_percent` |
| `transactions` | Payment lifecycle records | `transaction_id`, `txn_code`, `order_id`, `user_id`, `merchant_id`, `gateway_id`, `amount`, `payment_method`, `status` |
| `settlements` | Financial splits and merchant payouts | `settlement_id`, `settlement_code`, `merchant_id`, `transaction_id`, `gross_amount`, `unipay_fee`, `net_amount`, `status` |
| `refunds` | Customer refund requests and approvals | `refund_id`, `refund_code`, `transaction_id`, `amount`, `reason`, `status`, `refund_date` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20.x or later
- **npm** or **bun**
- *(Optional for Java backend)*: **Java 17+** & **Maven 3.8+**
- *(Optional for database deployment)*: **MySQL 8.0+**

### 1. Installation

Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration

Copy the example environment configuration:
```bash
cp .env.example .env
```

### 3. Database Setup (MySQL)

Import the provided SQL schema and seed data:
```bash
mysql -u root -p < database/unipay.sql
```

Default seeded credentials:
- **Customer**: `rahul@gmail.com` / `rahul123`
- **Merchant**: `merchant@gmail.com` (FoodFast) / `merchant123`
- **Admin**: `admin@gmail.com` / `admin123`

### 4. Running the Application

Start the local development server (Express API + Vite React UI):
```bash
npm run dev
```

The application will be accessible at:
```text
http://localhost:3000
```

---

## 🛠️ Build and Verification

- **Lint & Type Check**:
  ```bash
  npm run lint
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Preview Production**:
  ```bash
  npm run preview
  ```

---

## ☁️ Deploying to Render

You can deploy UNIPAY to [Render](https://render.com) as a **Web Service**:

1. **Service Type**: **Web Service** (do NOT choose Static Site, as UNIPAY needs the backend API server).
2. **Environment**: `Node`
### 3. Build Command:
```bash
npm install --legacy-peer-deps && npm run build
```
4. **Start Command**:
```bash
npm start
```
5. **Environment Variables**:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render sets this automatically)

### Common Render Deployment Errors & Solutions:
- **`Rolldown failed to resolve import "react-is" from ".../recharts/..."`**:
  - **Cause**: Recharts depends on `react-is`. When deploying on Render with Vite 8 / Rolldown bundling, npm tree pruning or peer resolution can leave `react-is` unhoisted unless explicitly declared.
  - **Fix Applied**: Added `"react-is": "^19.3.0"` explicitly into `dependencies` in `package.json`.
- **`npm error code ERESOLVE (esbuild / vite peer dependency conflict)`**:
  - **Cause**: Node/npm 7+ strictly checks peer dependencies. The pinned `esbuild@0.25.x` conflicted with `vite@8`'s optional peer requirement (`esbuild@^0.27.0 || ^0.28.0`).
  - **Fix Applied**: 
    1. Removed redundant `"esbuild"` pin from `package.json` devDependencies so `vite` and `tsx` manage their own compatible binaries.
    2. Added `.npmrc` with `legacy-peer-deps=true`.
    3. Changed the Render Build Command to `npm install --legacy-peer-deps && npm run build`.
- **`sh: 1: tsx: not found`**: Render skips devDependencies in production. `tsx` is included in regular `dependencies` in `package.json`.
- **`Port binding timeout`**: The server explicitly binds to `0.0.0.0:${PORT}` so Render's health check can reach it immediately.
- **`Cannot find module 'dist/index.html'`**: Ensure your Build Command runs `npm run build` so Vite compiles the client assets into `/dist` before the server boots.
- **Spring Boot backend on Render**: The root `server.ts` is a self-contained full-stack mirror that runs without needing an external MySQL instance. If deploying the Java Spring Boot service in `/unipay-backend`, set Root Directory to `unipay-backend`, Build Command to `mvn clean package -DskipTests`, and provision a managed cloud MySQL database (e.g., Aiven or Railway).

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
