const socketIo = require('socket.io');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim()) : ["http://localhost:5173"],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitUpdate = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  init,
  getIo,
  emitUpdate
};
