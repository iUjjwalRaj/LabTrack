# Lab Equipment & Asset Issue-Return Tracking System

A clean, beginner-friendly college practical web application built with **Node.js, Express.js, MongoDB Atlas / Mongoose, EJS, and Vanilla CSS**.

---

## 🎯 Features

- **Session-Based Authentication:** Register, Login, and Logout with `express-session` and `bcryptjs` password hashing.
- **Three User Roles:**
  - **Admin:** Add, view, edit, and delete equipment inventory.
  - **Requester (Student / Faculty):** Browse available equipment and submit issue requests.
  - **Lab In-charge:** Approve or reject requests, issue equipment (with stock check), and process returns (with condition tracking).
- **Stock Tracking:** Automatic decrementation of available inventory when issued, and incrementation upon return.
- **Overdue Returns:** Calculated on the fly (`currentDate > expectedReturnDate && status === 'Issued'`) without unnecessary cron jobs.
- **Dashboard:** Real-time summary cards for Total Assets, Available Units, Issued Units, Overdue Returns, and Damaged/Lost Items.
- **Maintenance Log (Stretch Goal):** Record repair dates, costs, next service due date, and remarks.

---

## 📁 Project Structure

```
project/
│
├── app.js                   # Main Express server setup & route mounting
├── package.json             # Dependencies and scripts
├── .env                     # Port, MongoDB URI & Session secret
├── .env.example             # Example configuration template
├── seed.js                  # Database seeder for demo accounts & assets
│
├── config/
│   └── db.js                # MongoDB Mongoose connection
│
├── models/
│   ├── User.js              # User schema (name, email, password, role)
│   ├── Asset.js             # Asset schema (assetTag, name, category, condition, quantity, availableQuantity)
│   ├── Request.js           # Request schema (asset, requester, quantity, return date, status, etc.)
│   └── Maintenance.js       # Maintenance schema (asset, serviceDate, cost, nextServiceDue, notes)
│
├── middleware/
│   └── auth.js              # requireLogin and requireRole middlewares
│
├── routes/
│   ├── auth.js              # Login, register, logout routes
│   ├── admin.js             # Asset CRUD & maintenance log routes
│   ├── requester.js         # Equipment catalog & request routes
│   ├── labIncharge.js       # Approve, reject, issue & return routes
│   └── dashboard.js         # Dashboard statistics & summary calculations
│
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Common navbar with role badge & logout
│   │   └── footer.ejs       # Common footer
│   ├── login.ejs            # Login page with demo credentials quick-fill
│   ├── register.ejs         # User registration page
│   ├── dashboard.ejs        # Dashboard with 5 metric cards & alert tables
│   ├── assets.ejs           # Inventory list table
│   ├── asset-form.ejs       # Add / edit asset form
│   ├── equipment.ejs        # Requester available equipment cards
│   ├── request-form.ejs     # Equipment borrowing request form
│   ├── requests.ejs         # Request tracking & approval/return actions table
│   ├── maintenance.ejs      # Equipment maintenance log & history
│   └── error.ejs            # Error display page
│
└── public/
    └── style.css            # Clean, modern, responsive CSS styling
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local MongoDB or MongoDB Atlas)

### 2. Installation
```bash
git clone <repository-url>
cd "Lab Equipment & Asset Issue-Return Tracking System"
npm install
```

### 3. Environment Variables
Create a `.env` file (or use existing `.env`):
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/lab_tracking
SESSION_SECRET=college_lab_project_secret_key_123
```
*(For MongoDB Atlas, simply replace `MONGODB_URI` with your Atlas connection string).*

### 4. Seed Demo Data
Populate the database with pre-configured accounts, equipment, an overdue item, and sample maintenance:
```bash
npm run seed
```

### 5. Start Server (Traditional Node.js)
```bash
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## ☁️ Running on Cloudflare Workers (Local & Production)

This project is fully adapted to run on **Cloudflare Workers** using the official `httpServerHandler` Express bridge, `nodejs_compat_v2`, and Ahead-Of-Time (AOT) precompiled EJS templates (disallowing dynamic eval for maximum edge performance and security).

### 1. Local Worker Development
Ensure you have a `.dev.vars` file created (do NOT commit secrets to Git):
```bash
cp .dev.vars.example .dev.vars
```
Then start the local Wrangler development server:
```bash
npm run dev:worker
```
Open **`http://localhost:8787`** in your browser.

### 2. Production Deployment
When you are ready to deploy to Cloudflare:

1. Set your production secrets in Cloudflare (keep them out of Git!):
   ```bash
   npx wrangler secret put MONGODB_URI
   npx wrangler secret put SESSION_SECRET
   ```
2. Deploy the Worker:
   ```bash
   npm run deploy
   ```

---

## 🔑 Demo Accounts

The login page contains one-click auto-fill buttons for each role:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@lab.com` | `admin123` |
| **Lab In-charge** | `incharge@lab.com` | `incharge123` |
| **Requester (Student)** | `student@lab.com` | `student123` |

