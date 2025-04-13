const express = require('express');
const router = express.Router();
const db = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

router.post('/admin')