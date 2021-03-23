const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;

const LIGHT = "LIGHT",
  BOARD = "BOARD",
  SCORE = "SCORE",
  SWORD = "SWORD";

var swordActivated = false;
const SWORD_TIMEOUT_THRESHOLD = 1000;

const devices = {
  LIGHT,
  SCORE,
  SWORD,
  BOARD,
};

app.get("/", (req, res) => {
  res.send("Parangi App!");
});

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);

  //   Register device type
  socket.on("register-client", function (data) {
    console.log("Socket registered - " + socket.id + " " + data);
    devices[data] = socket.id;
  });

  //   Sword activation
  socket.on(SWORD, (socket) => {
    swordActivated = true;
    setTimeout(() => {
      if (swordActivated) {
        swordActivated = false;
      }
    }, SWORD_TIMEOUT_THRESHOLD);
  });

  socket.on(BOARD, (socket) => {});
});

const emitLight = () => {
  if (swordActivated) {
    swordActivated = false;
    //TODO: check pattern before emitting to light.
    io.to(devices.LIGHT).emit(LIGHT, 1);
  }
};

http.listen(PORT, () => console.log("App is running at port " + PORT));
