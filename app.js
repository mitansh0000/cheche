const path = require('path');
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
const videoCallSockets = io.of('/video-call');
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
// Define a route for the video call page
app.get('/video-call', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'video-call.html'));
});
// Video Call Socket Namespace
videoCallSockets.on('connection', (socket) => {
  console.log('A user connected to video call');

  socket.on('join-room', () => {
    socket.join('video-call-room');
  });

  socket.on('ice-candidate', (candidate) => {
    videoCallSockets.to('video-call-room').emit('ice-candidate', candidate);
  });

  socket.on('offer', (offer) => {
    videoCallSockets.to('video-call-room').emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    videoCallSockets.to('video-call-room').emit('answer', answer);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from video call');
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
