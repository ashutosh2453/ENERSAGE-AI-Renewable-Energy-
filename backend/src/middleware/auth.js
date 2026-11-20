const jwt = require('jsonwebtoken');

function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'your_jwt_secret_here' || secret.length < 16) {
        throw new Error('JWT_SECRET must be set to a random value of at least 16 characters');
    }
    return secret;
}

const protect = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        // Pin the algorithm so a token can never pick its own verification method.
        const decoded = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] });
        req.user = { userId: decoded.userId, email: decoded.email };
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect, jwtSecret };
