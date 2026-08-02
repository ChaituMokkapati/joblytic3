import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'amb_saas_super_secret_jwt_key_2026';

/**
 * Authentication Middleware
 * Checks if token exists in header "Authorization" (Format: "Bearer <token>")
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  // TODO: Replace with MongoDB + real JWT later
  if (token === 'dummy-jwt-token') {
    req.user = { id: 'usr-dummy', name: 'Demo Candidate', email: 'demo@ambjobs.com' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export default authenticateToken;
