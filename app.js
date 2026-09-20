require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');

// Initialize Express App
const app = express();

// Connect to MongoDB
connectDB();

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve Static Files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'college_lab_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day session
  })
);

// Make user session available in all EJS templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Import Route Handlers
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const requesterRoutes = require('./routes/requester');
const labInchargeRoutes = require('./routes/labIncharge');

// Home Route: redirect based on login status
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Mount Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', adminRoutes);
app.use('/', requesterRoutes);
app.use('/', labInchargeRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested does not exist.',
    user: req.session.user || null
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Lab Equipment Tracking System Running! `);
  console.log(` URL: http://localhost:${PORT} `);
  console.log(`=========================================`);
});
