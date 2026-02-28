require('dotenv').config();
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});

app.use(express.json());

app.set('socketio', io);

const eventRoutes = require('./routes');
app.use('/api', eventRoutes);

io.on('connection', (socket) => {
    console.log('📱 Un utilisateur s\'est connecté en temps réel');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`serveur lancé sur le port ${PORT}`);
});