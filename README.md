# Système de Gestion de Tickets

Ce projet est une API REST pour un système de gestion de tickets permettant aux utilisateurs de créer des demandes d'assistance qui peuvent être prises en charge par des techniciens, le tout sous la supervision d'administrateurs.

## Fonctionnalités

- **Authentification** : Système de connexion avec JWT pour trois rôles (utilisateur, technicien, administrateur)
- **Gestion des utilisateurs** : Création de comptes par l'administrateur uniquement
- **Gestion des tickets** :
    - Création de tickets par les utilisateurs
    - Consultation de tickets (filtrée par rôle)
    - Mise à jour des tickets par les techniciens
    - Suppression de tickets par les administrateurs

## Installation

1. Cloner le dépôt
2. Installer les dépendances avec `npm install`
3. Démarrer le serveur avec `node index.js`

## Initialisation

Au premier démarrage, le système crée automatiquement un compte administrateur :
- Email : admin@admin.com
- Identifiant : admin
- Mot de passe : admin1234

## API Endpoints

### Authentification

- `POST /auth/admin` : Connexion administrateur
- `POST /auth/login` : Connexion utilisateur ou technicien
- `POST /auth/new` : Création d'un nouvel utilisateur (admin uniquement)

### Tickets

- `POST /tickets` : Créer un nouveau ticket (utilisateur)
- `GET /tickets` : Obtenir la liste des tickets (utilisateurs : leurs tickets uniquement, techniciens : tous les tickets)
- `GET /tickets/:id` : Obtenir les détails d'un ticket spécifique
- `PUT /tickets/:id` : Modifier un ticket (technicien uniquement)
- `DELETE /admin/tickets/:id` : Supprimer un ticket (admin uniquement)

## Formats de données

### Utilisateur

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "user|technician|admin"
}
```

### Ticket

```json
{
  "title": "string",
  "description": "string",
  "status": "open|in progress|closed",
  "userId": "integer",
  "technicianId": "integer|null",
  "createdAt": "ISO8601 date",
  "closedAt": "ISO8601 date|null"
}
```

## Sécurité

- Toutes les routes (sauf login) nécessitent un token JWT valide
- Les mots de passe sont hachés avec bcrypt
- Les accès sont filtrés selon le rôle de l'utilisateur

## Technologies utilisées

- Node.js
- Express.js
- Knex.js (SQL query builder)
- JWT pour l'authentification
- bcrypt pour le hachage des mots de passe
- express-validator pour la validation des données