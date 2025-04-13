require('dotenv').config();
const express = require('express');
const app = express();
const initializeTables = require('./models/init');

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

initializeTables().then(() => {
    app.listen(3000, () => {
        console.log('Serveur démarré sur le port 3000');
    });
});