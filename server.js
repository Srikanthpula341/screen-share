// server.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle events when a user wants to join a room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  // Handle events when a user leaves a room
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  // Relay messages between peers in the same room
  socket.on("message", (data) => {
    io.to(data.room).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

server.listen(port, "192.168.39.38", () => {
  console.log('192.168.39.38:'+`${port}`);
});
