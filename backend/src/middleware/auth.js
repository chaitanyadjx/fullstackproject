const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect — requires a valid JWT Bearer token.
 * Attaches `req.user` (without passwordHash).
 */
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      '-passwordHash -passwordResetToken -passwordResetExpires'
    );
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * requireRole(...roles) — must be used after `protect`.
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role.' });
    }
    next();
  };
}

module.exports = { protect, requireRole };
