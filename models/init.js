const db = require("../db/knex");
const bcrypt = require('bcrypt');

async function createAdmin() {
    const admin = await db('users').where({ username: 'admin' }).first();
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin1234', 10);
        await db('users').insert({
            email: 'admin@admin.com',
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
        });
        console.log('Admin créé : admin | admin1234');
    }
}

async function initializeTables() {
    const existsUsers = await db.schema.hasTable("users");
    if (!existsUsers) {
        await db.schema.createTable("users", (table) => {
            table.increments('id').primary();
            table.string('username').notNullable();
            table.string('email').notNullable().unique();
            table.string('password').notNullable();
            table.string('role').notNullable(); // user | technician | admin
        });
    }

    const existsTickets = await db.schema.hasTable('tickets');
    if (!existsTickets) {
        await db.schema.createTable('tickets', (table) => {
            table.increments('id').primary();
            table.string('title').notNullable();
            table.text('description').notNullable();
            table.string('status').notNullable(); // open | in progress | closed
            table.integer('userId').unsigned().notNullable().references('id').inTable('users');
            table.integer('technicianId').unsigned().references('id').inTable('users').nullable();
            table.timestamp('createdAt').defaultTo(db.fn.now());
            table.timestamp('closedAt').nullable();
        });
    }
    await createAdmin();
}

module.exports = initializeTables;