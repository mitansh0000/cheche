const path = require('path');
function generateMessageId() {
  // You need to implement a function to generate a unique message ID
  // For simplicity, you can use a timestamp as the message ID, but this may not be foolproof in a real-world scenario
  return Date.now().toString();
}
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
let stream = require( './ws/stream' );
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(express.static('public'));
app.use( '/src', express.static( path.join( __dirname, 'src' ) ) );

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
});
io.of( '/stream' ).on( 'connection', stream );
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
