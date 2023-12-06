function generateMessageId() {
  // You need to implement a function to generate a unique message ID
  // For simplicity, you can use a timestamp as the message ID, but this may not be foolproof in a real-world scenario
  return Date.now().toString();
}
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const messages = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('messageHistory', messages);

  socket.on('message', (message, username) => {
    const messageId = generateMessageId();
    const messageWithId = { id: messageId, content: message, username: username };
    messages.push(messageWithId);
    io.emit('message', messageWithId);
  });

  socket.on('deleteMessage', (messageId, requestingUsername) => {
    console.log('Received deleteMessage event on server', messageId, requestingUsername);
    if (messageId && requestingUsername) {
      const index = messages.findIndex((message) => message.id === messageId && message.username === requestingUsername);
      if (index !== -1) {
        const deletedMessage = messages.splice(index, 1)[0];
        io.emit('deleteMessage', { messageId: deletedMessage.id });
        console.log('Message deleted on server', deletedMessage);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('setUsername', (username) => {
    socket.username = username;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
