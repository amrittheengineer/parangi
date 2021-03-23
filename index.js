const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);
  socket.on("register-client", function (data) {
    socket.join(data);
  });
});

http.listen(PORT, () => console.log("App is running at port " + PORT));
