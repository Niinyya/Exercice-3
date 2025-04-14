const jwt = require('jsonwebtoken');

// Authentication du token de l'utilisateur
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token Invalide' });
    }
}

// Vérification des roles authorisé à utiliser la route
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        next();
    }
}

module.exports = { authenticate, authorizeRoles };