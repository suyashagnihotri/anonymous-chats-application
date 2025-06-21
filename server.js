const { Server } = require("socket.io");
const io = new Server(4000, {
  cors: {
    origin: "*",
  }
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("message", (msg) => {
    socket.broadcast.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
