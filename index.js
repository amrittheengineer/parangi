const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Parangi App!");
});

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);
  socket.on("register-client", function (data) {
    console.log("Socket emitted - " + socket.id + " " + data);
    // socket.join(data);
  });
});

http.listen(PORT, () => console.log("App is running at port " + PORT));
