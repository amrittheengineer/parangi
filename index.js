var io = require("socket.io").listen(80);

const LIGHT = "light";
const STUDENT = "student";
const TEACHER = "";

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);
  socket.on("register-client", function (data) {
    socket.join(data);
  });
});
