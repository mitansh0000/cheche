function generateMessageId() {
  // You need to implement a function to generate a unique message ID
  // For simplicity, you can use a timestamp as the message ID, but this may not be foolproof in a real-world scenario
  return Date.now().toString();
}
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');

const peers = {};
const messages = {};

function generateMessageId() {
  return Date.now().toString();
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('messageHistory', messages);

  socket.on('message', (message, username) => {
    const messageId = generateMessageId();
    const messageWithId = { id: messageId, content: message, username: username };
    if (!messages[socket.room]) {
      messages[socket.room] = [];
    }
    messages[socket.room].push(messageWithId);
    io.to(socket.room).emit('message', messageWithId);
  });

  socket.on('deleteMessage', (messageId, requestingUsername) => {
    console.log('Received deleteMessage event on server', messageId, requestingUsername);
    if (messageId && requestingUsername) {
      const index = messages[socket.room].findIndex((message) => message.id === messageId && message.username === requestingUsername);
      if (index !== -1) {
        const deletedMessage = messages[socket.room].splice(index, 1)[0];
        io.to(socket.room).emit('deleteMessage', { messageId: deletedMessage.id });
        console.log('Message deleted on server', deletedMessage);
      }
    }
  });

    // Notify about the chat room
    io.to(roomId).emit('chat-joined', username);
  });

  socket.on('offer', (roomId, offer, from) => {
    socket.to(roomId).emit('offer', offer, from);
  });

  socket.on('answer', (roomId, answer, from) => {
    socket.to(roomId).emit('answer', answer, from);
  });

  socket.on('ice-candidate', (roomId, candidate, from) => {
    socket.to(roomId).emit('ice-candidate', candidate, from);
  });

  socket.on('user-disconnected', () => {
    for (const roomId in peers) {
      const index = peers[roomId].indexOf(socket.id);
      if (index !== -1) {
        peers[roomId].splice(index, 1);

        // Notify remaining users in the room about the disconnection
        io.to(roomId).emit('user-disconnected', socket.id);

        // Update connections for the remaining users in the room
        peers[roomId].forEach(peerId => {
          io.to(peerId).emit('ready', roomId, socket.id);
        });
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

// Define a route for the video call page
app.get('/video-call', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'video-call.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
