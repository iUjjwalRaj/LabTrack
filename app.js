require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Initialize Express App
const app = express();

// Connect to MongoDB immediately only in standalone Node.js process (deferred to handler in Workers)
if (require.main === module) {
  connectDB();
}

const ejs = require('ejs');

// Determine base directory safely in both Node.js and bundled Worker environments
const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// View Engine Setup
// Cloudflare Workers disallows dynamic code generation (eval / new Function) at runtime.
// When running in Workers or when views-compiled.js exists, we use ahead-of-time compiled
// EJS templates without any eval(). In traditional Node.js development without compiled views,
// Express seamlessly falls back to standard EJS rendering.
let compiledViews = null;
try {
  compiledViews = require('./views-compiled.js');
} catch (e) {
  // Compiled views not present, will use standard EJS in Node.js
}

if (compiledViews) {
  const defaultLocals = {
    currentUser: null,
    user: null,
    error: null,
    success: null,
    asset: null,
    assets: [],
    equipment: [],
    request: null,
    requests: [],
    stats: null,
    recentRequests: [],
    recentMaintenance: [],
    maintenanceLogs: [],
    logs: [],
    log: null,
    isStaffView: false,
    isEdit: false,
    action: '',
    title: '',
    search: '',
    category: '',
    condition: '',
    status: '',
    formData: null,
    message: null,
    damagedOrLostAssets: [],
    damagedOrLostCount: 0,
    damagedOrLostReturns: [],
    overdueCount: 0,
    overdueRequests: [],
    totalAssets: 0,
    totalAvailableUnits: 0,
    totalIssuedUnits: 0,
    currentFilter: 'all'
  };


  function renderCompiledView(name, locals) {
    const cleanName = name.replace(/\.ejs$/, '');
    const tpl = compiledViews[cleanName];
    if (!tpl) throw new Error('Compiled view not found: ' + name);

    const safeLocals = Object.assign({}, defaultLocals, locals);
    if (!safeLocals.user && safeLocals.currentUser) safeLocals.user = safeLocals.currentUser;
    if (!safeLocals.currentUser && safeLocals.user) safeLocals.currentUser = safeLocals.user;

    function includeHelper(incName, incLocals) {
      const cleanInc = incName.replace(/\.ejs$/, '');
      const incTpl = compiledViews[cleanInc];
      if (!incTpl) throw new Error('Include view not found: ' + incName);
      return incTpl(Object.assign({}, safeLocals, incLocals), null, includeHelper);
    }

    return tpl(safeLocals, null, includeHelper);
  }

  class CompiledEjsView {
    constructor(name) {
      this.name = name.replace(/\.ejs$/, '');
      this.path = this.name;
    }
    render(options, callback) {
      try {
        const html = renderCompiledView(this.name, options);
        callback(null, html);
      } catch (err) {
        callback(err);
      }
    }
  }

  app.set('view engine', 'ejs');
  app.set('view', CompiledEjsView);
} else {
  app.engine('ejs', ejs.__express);
  app.set('view engine', 'ejs');
  app.set('views', path.join(baseDir, 'views'));
}

// Middleware to ensure DB connection is active in serverless request contexts
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error in middleware:', err);
  }
  next();
});

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve Static Files (CSS, JS, Images)
app.use(express.static(path.join(baseDir, 'public')));

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
  const user = req.session ? req.session.user : null;
  res.locals.currentUser = user || null;
  res.locals.user = user || null;
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

// Start Server if run directly via node app.js
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Lab Equipment Tracking System Running! `);
    console.log(` URL: http://localhost:${PORT} `);
    console.log(`=========================================`);
  });
}

module.exports = app;
