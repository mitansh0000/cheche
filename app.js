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
  socket.on('join', (roomId) => {
    const selectedRoom = io.sockets.adapter.rooms[roomId]
    const numberOfClients = selectedRoom ? selectedRoom.length : 0

    // These events are emitted only to the sender socket.
    if (numberOfClients == 0) {
      console.log(`Creating room ${roomId} and emitting room_created socket event`)
      socket.join(roomId)
      socket.emit('room_created', roomId)
    } else if (numberOfClients == 1) {
      console.log(`Joining room ${roomId} and emitting room_joined socket event`)
      socket.join(roomId)
      socket.emit('room_joined', roomId)
    } else {
      console.log(`Can't join room ${roomId}, emitting full_room socket event`)
      socket.emit('full_room', roomId)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('setUsername', (username) => {
    socket.username = username;
  });
// Define a route for the video call page
app.get('/video-call', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'video-call.html'));
});
 // These events are emitted to all the sockets connected to the same room except the sender.
 socket.on('start_call', (roomId) => {
  console.log(`Broadcasting start_call event to peers in room ${roomId}`)
  socket.broadcast.to(roomId).emit('start_call')
})
socket.on('webrtc_offer', (event) => {
  console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
  socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
})
socket.on('webrtc_answer', (event) => {
  console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
  socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
})
socket.on('webrtc_ice_candidate', (event) => {
  console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
  socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
})
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
