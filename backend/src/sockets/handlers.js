function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // Mesero se une a sala "meseros"
    socket.on('join:meseros', (data) => {
      socket.join('meseros');
      console.log(`👨‍🍳 Mesero ${data?.nombre || socket.id} se unió a sala meseros`);
    });

    // Cliente se suscribe a un pedido específico
    socket.on('join:pedido', ({ pedidoId }) => {
      const room = `pedido-${pedidoId}`;
      socket.join(room);
      console.log(`👤 Cliente suscrito a ${room}`);
    });

    // Cliente se suscribe por teléfono
    socket.on('join:cliente', ({ telefono }) => {
      socket.join(`cliente-${telefono}`);
      console.log(`📱 Cliente con tel ${telefono} suscrito`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket desconectado: ${socket.id}`);
    });
  });
}

module.exports = setupSockets;
