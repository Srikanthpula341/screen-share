// const express = require('express');
// const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);
// const cors = require('cors');
// const port = 3000; // Change this to your desired port

// // Use CORS middleware to allow requests from the client-side origin (e.g., http://localhost:8000)
// app.use(cors({
//   origin: 'http://localhost:8000'
// }));

// // Store room information
// const rooms = {};

// io.on('connection', (socket) => {
//   console.log('New client connected:', socket.id);

//   // Handle room creation/joining
//   socket.on('createOrJoin', (room) => {
//     const clientsInRoom = io.sockets.adapter.rooms.get(room);
//     const numClients = clientsInRoom ? clientsInRoom.size : 0;

//     if (numClients === 0) {
//       // This is a new room
//       socket.join(room);
//       rooms[room] = [socket.id];
//       socket.emit('created', room, socket.id);
//     } else if (numClients === 1) {
//       // Room already has one participant
//       socket.join(room);
//       rooms[room].push(socket.id);
//       socket.emit('joined', room, socket.id);
//       io.to(room).emit('ready', rooms[room]);
//     } else {
//       // Room is full
//       socket.emit('full', room);
//     }
//   });

//   // Handle signaling message exchange
//   socket.on('message', (message, room) => {
//     // Broadcast the message to all participants in the room except the sender
//     socket.to(room).emit('message', message);
//   });

//   // Handle client disconnection
//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);

//     // Remove the disconnected client from room
//     for (const room in rooms) {
//       const index = rooms[room].indexOf(socket.id);
//       if (index !== -1) {
//         rooms[room].splice(index, 1);
//         if (rooms[room].length === 0) {
//           // No more participants in the room, remove the room
//           delete rooms[room];
//         }
//       }
//     }
//   });
// });

// server.listen(port, () => {
//   console.log(`Signaling server is running on port ${port}`);
// });
