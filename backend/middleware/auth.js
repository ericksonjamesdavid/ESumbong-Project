const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// JWT Verification Middleware
const verifyJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer token"

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded; // Store admin info in request for later use
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
        
        return res.status(403).json({ success: false, message: 'Invalid token. Access denied.' });
    }
};

module.exports = { verifyJWT };
