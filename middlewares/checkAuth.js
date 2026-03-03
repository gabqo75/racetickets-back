const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: "Accès refusé. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        res.status(403).json({ message: "Token invalide ou expiré." });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && (req.user.is_admin || req.user.role === 'admin')) {
        next(); 
    } else {
        res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
    }
};