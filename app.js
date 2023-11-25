const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Array to store chat messages
const messages = [];

// WebSocket connection event
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send existing messages to the new user
  socket.emit('messageHistory', messages);

  // Listen for new messages
  socket.on('message', (message) => {
    messages.push(message);
    // Broadcast the new message to all connected clients
    io.emit('message', message);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
