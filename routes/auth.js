const express = require('express');
const router = express.Router();
const db = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const userValidation = [
    body('username').isString().notEmpty(),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('role').isIn(['user', 'technician', 'admin'])
];
const loginValidation = [
    body('email').isEmail(),
    body('password').isString().notEmpty()
];

// Connexion d'un admin
router.post('/admin', loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const admin = await db('users').where({ email, role: 'admin'}).first();
    if (!admin) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }
    const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET);
    res.json({ token });
});

// Création d'un utilisateur ou technicien
router.post('/new', authenticate, authorizeRoles('admin'), userValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password, role } = req.body;
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
        return res.status(400).json({ errors: 'Email déjà utilisé' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db('users').insert({ username: username, email: email, password: hashedPassword, role: role });
    res.status(201).json({ message: `${role} créé avec succès`});
});

// Authentification d'un utilisateur ou technicien
router.post('/login', loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await db('users').whereNot('role', 'admin').where({ email }).first();
    if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
})

module.exports = router;