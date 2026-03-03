require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io');

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const db = require('./db');

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});

app.use(express.json());

app.set('socketio', io);

const eventRoutes = require('./routes');
app.use('/api', eventRoutes);

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`serveur lancé sur le port ${PORT}`);
});