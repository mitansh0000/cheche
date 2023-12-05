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

  socket.on('message', (message) => {
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('deleteMessage', (index) => {
    if (index >= 0 && index < messages.length) {
      const message = messages[index];
      const username = getUsernameFromMessage(message);

      if (username === socket.username) {
        messages.splice(index, 1);
        io.emit('deleteMessage', index);
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

function getUsernameFromMessage(message) {
  return message.split(':')[0].replace('<strong>', '').trim();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
