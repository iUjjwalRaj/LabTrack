const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET: Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    title: 'Login',
    error: req.query.error || null,
    success: req.query.registered ? 'Registration successful! You can now log in.' : null
  });
});

// POST: Process Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Please enter both email and password.',
      success: null
    });
  }

  try {
    // 1. Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password.',
        success: null
      });
    }

    // 2. Check password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password.',
        success: null
      });
    }

    // 3. Store user details in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      title: 'Login',
      error: 'An error occurred during login. Please try again.',
      success: null
    });
  }
});

// GET: Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', {
    title: 'Register',
    error: null
  });
});

// POST: Process Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate inputs
  if (!name || !email || !password) {
    return res.render('register', {
      title: 'Register',
      error: 'Please fill in all required fields.'
    });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'An account with this email already exists.'
      });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create and save new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'requester'
    });

    await newUser.save();

    // Redirect to login with success flag
    res.redirect('/login?registered=true');
  } catch (error) {
    console.error('Register error:', error);
    res.render('register', {
      title: 'Register',
      error: 'Failed to create account. Please check your inputs.'
    });
  }
});

// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
