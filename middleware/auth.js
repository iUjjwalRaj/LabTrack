// Middleware to ensure user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware to restrict access to specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        user: req.session.user
      });
    }

    next();
  };
};

module.exports = {
  requireLogin,
  requireRole
};
