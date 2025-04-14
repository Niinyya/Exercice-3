const knex = require('knex');

// initialisation de la base de donnée
const db = knex({
    client: 'sqlite3',
    connection: {
        filename: "./data.sqlite3"
    },
    useNullAsDefault: true,
});

module.exports = db;