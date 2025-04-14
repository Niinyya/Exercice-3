const express = require('express');
const router = express.Router();
const db = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, query, matchedData, validationResult } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

// Rejeter la création d'un ticket fait par un admin
function rejectAdmins(req, res, next) {
    if(req.user.role === 'admin') {
        return res.status(403).json({ error: 'Les administrateurs ne peuvent pas accéder aux tickets' });
    }
    next();
}

// Chaine de validation express-validator
const ticketValidation = [
    body('title').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('status').isIn(['open', 'in progress', 'closed']),
    body('userId').isInt({ gt: 0 }),
    body('technicianId').optional({ nullable: true }).isInt({ gt: 0 }),
    body('createdAt').isISO8601(),
    body('closedAt').optional({ nullable: true }).isISO8601()
];

// Création d'un nouveau ticket
router.post('/', authenticate, rejectAdmins, ticketValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, userId, technicianId, createdAt, closedAt } = req.body;

    if (closedAt && status === 'closed') {
        return res.status(400).json({ error: 'Si closedAt est défini, le statut doit être "closed"' });
    }

    if (closedAt && new Date(closedAt) <= new Date(createdAt)) {
        return res.status(400).json({ error: 'closedAt doit être après createdAt' });
    }

    // Vérification du userId et technicien
    const user = await db('users').where({ id: userId, role: 'user' }).first();
    if (!user) return res.status(400).json({ error: 'Utilisateur invalide' });

    if (technicianId) {
        const tech = await db('users').where({ id: technicianId, role: 'technician' }).first();
        if (!tech) return res.status(400).json({ error: 'Technicien invalide' });
    }

    const [id] = await db('tickets').insert({ title, description, status, userId, technicianId, createdAt, closedAt });
    res.status(201).json({ id });

});

// Obtention de la liste des tickets (toute la liste pour les technician et juste ceux associer au user pour les utilisateurs)
router.get('/', authenticate, rejectAdmins, async (req, res) => {
    if (req.user.role === 'technician') {
        const tickets = await db('tickets');
        return res.json(tickets);
    }

    const tickets = await db('tickets').where({userId: req.user.id});
    res.json(tickets);
});

// Obtenir les détails d'un ticket spécifique
router.get('/:id', authenticate, rejectAdmins, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const ticket = await db('tickets').where({ id: req.params.id }).first();
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    if (req.user.role === 'user' && ticket.userId !== req.user.id) {
        return res.status(403).json({ error: 'Accès interdit à ce ticket' });
    }
    res.json(ticket);
});

// Modification d'un ticket
router.put('/:id', authenticate, authorizeRoles('technician'), ticketValidation, async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { title, description, status, userId, technicianId, createdAt, closedAt } = req.body;

        const existing = await db('tickets').where({ id: req.params.id }).first();
        if (!existing) return res.status(404).json({ error: 'Ticket non trouvé' });

        if (closedAt && status !== 'closed') {
            return res.status(400).json({ error: 'Si closedAt est défini, le statut doit être "closed"' });
        }

        if (closedAt && new Date(closedAt) <= new Date(createdAt)) {
            return res.status(400).json({ error: 'closedAt doit être après createdAt' });
        }

        await db('tickets').where({ id: req.params.id }).update({
            title, description, status, userId, technicianId, createdAt, closedAt
        });

        res.json({ message: 'Ticket mis à jour' });
    }
);

// Suppréssion d'un ticket
router.delete('/admin/tickets/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
        const deleted = await db('tickets').where({ id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Ticket introuvable' });

        res.json({ message: 'Ticket supprimé' });
    }
);

module.exports = router;