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

var activatedPoint = null;
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
  res.send("Emitted 1 to " + devices.LIGHT);
  io.emit(LIGHT, 1);
});

app.get("/l2", (req, res) => {
  res.send("Emitted 2 to " + devices.LIGHT);
  io.emit(LIGHT, 2);
});

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);

  //   Register device type
  socket.on(REGISTER_CLIENT, function (data) {
    console.log("Socket registered - " + socket.id + " " + data);
    devices[data] = socket.id;
  });

  //   Fence activation
  socket.on(SWORD, onSwordSuccess);
  socket.on(BOARD, onBoardSuccess);

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

// const fenceListener = (data) => {
//   if (activated) {
//     return successFence(data);
//   }

//   activated = true;
//   setTimeout(() => {
//     if (activated) {
//       activated = false;
//     }
//   }, SWORD_TIMEOUT_THRESHOLD);
// };

var swordActivated = false;

const onBoardSuccess = (data) => {
  console.log("board function");
  if (!swordActivated) {
    activatedPoint = data;
    setTimeout(() => {
      if (activatedPoint) {
        console.log("Board deactivated - " + activatedPoint);
        activatedPoint = null;
      }
    }, SWORD_TIMEOUT_THRESHOLD);
    return;
  }
  if (score.assignedPatterns.includes(data)) {
    if (!score.patternFenced.includes(data)) {
      score.patternFenced.push(data);
    }
    //   Emit success light
    io.emit(LIGHT, 1);
  } else {
    //   Emit failure light
    io.emit(LIGHT, 2);
  }
  reset();
};

function reset() {
  console.log("RESETTED");
  activatedPoint = null;
  swordActivated = false;
}

const onSwordSuccess = (data) => {
  console.log("got from sword");
  if (data == 0) {
    if (!activatedPoint) {
      console.log("Sword activated");
      swordActivated = true;
      setTimeout(() => {
        if (swordActivated) {
          console.log("Sword activated");
          swordActivated = false;
        }
      }, SWORD_TIMEOUT_THRESHOLD);
      return;
    }
    if (score.assignedPatterns.includes(activatedPoint)) {
      if (!score.patternFenced.includes(activatedPoint)) {
        score.patternFenced.push(activatedPoint);
      }
      //   Emit success light
      io.emit(LIGHT, 1);
    } else {
      //   Emit failure light
      io.emit(LIGHT, 2);
    }
    reset();
  }
};

http.listen(PORT, () => console.log("App is running at port " + PORT));
