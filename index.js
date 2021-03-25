const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;

const LIGHT = "LIGHT",
  BOARD = "BOARD",
  SCORE = "SCORE",
  RESULT = "RESULT",
  ASSIGN_PATTERN = "ASSIGN_PATTERN",
  REGISTER_CLIENT = "REGISTER_CLIENT",
  SWORD = "SWORD";

var swordActivated = false;
const SWORD_TIMEOUT_THRESHOLD = 2000;

const score = {
  assignedPatterns: [],
  patternFenced: [],
};

const devices = {
  LIGHT,
  SWORD,
  BOARD,
};

app.get("/", (req, res) => {
  res.send("Emitted to " + devices.LIGHT);
  io.to(devices.LIGHT).emit(LIGHT, 1);
});

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);

  //   Register device type
  socket.on(REGISTER_CLIENT, function (data) {
    console.log("Socket registered - " + socket.id + " " + data);
    devices[data] = socket.id;
  });

  //   Fence activation
  socket.on(SWORD, fenceListener);
  socket.on(BOARD, fenceListener);

  //   Assign pattern
  socket.on(ASSIGN_PATTERN, (data) => {
    console.log(data);
    score.assignedPatterns = data || [];
  });

  //   Emit score
  socket.on(SCORE, () => {
    const scoreString = `${score.patternFenced.length}/${score.assignedPatterns.length}`;
    console.log(SCORE, scoreString);
    io.emit(RESULT, scoreString);
  });
});

const fenceListener = (data) => {
  if (swordActivated) {
    return successFence(data);
  }

  swordActivated = true;
  setTimeout(() => {
    if (swordActivated) {
      swordActivated = false;
    }
  }, SWORD_TIMEOUT_THRESHOLD);
};

const successFence = (data) => {
  swordActivated = false;
  //TODO: check pattern before emitting to light.

  if (score.assignedPatterns.includes(data)) {
    if (!score.patternFenced.includes(data)) {
      score.patternFenced.push(data);
    }
    //   Emit light
    io.to(devices.LIGHT).emit(LIGHT, 1);
  }
};

http.listen(PORT, () => console.log("App is running at port " + PORT));
