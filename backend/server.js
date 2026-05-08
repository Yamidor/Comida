require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Middlewares globales
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes subidas
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_PATH || './uploads')));

// Inyectar io en req para uso en rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/categorias', require('./src/routes/categorias'));
app.use('/api/productos', require('./src/routes/productos'));
app.use('/api/promociones', require('./src/routes/promociones'));
app.use('/api/clientes', require('./src/routes/clientes'));
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/pedidos', require('./src/routes/pedidos'));
app.use('/api/finanzas', require('./src/routes/finanzas'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Socket handlers
const setupSockets = require('./src/sockets/handlers');
setupSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Araquiu Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Socket.IO activo`);
  console.log(`🗄️  Conectando a MySQL...\n`);
});
