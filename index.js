const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 5000;
const fs = require("fs");
const FILE_NAME = "session_data.json";

var total_session_data = require(`./${FILE_NAME}`);
var current_session = {};

const LIGHT = "LIGHT",
  BOARD = "BOARD",
  SCORE = "SCORE",
  RESULT = "RESULT",
  ASSIGN_PATTERN = "ASSIGN_PATTERN",
  REGISTER_CLIENT = "REGISTER_CLIENT",
  START_SESSION = "START_SESSION",
  STOP_SESSION = "STOP_SESSION",
  SWORD = "SWORD";

var activatedPoint = null;
const SWORD_TIMEOUT_THRESHOLD = 2000;

const score = {
  assignedPatterns: [],
  patternFenced: [],
  boardPoints: [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
  ],
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

app.get("/finish", (req, res) => {
  const student_name = req.query.student_name.trim();
  console.log(student_name);
  return res.send(
    total_session_data.filter((s) => s.student_name === student_name)
  );
});

io.sockets.on("connection", function (socket) {
  console.log("Socket connected - " + socket.id);

  //   Register device type
  socket.on(REGISTER_CLIENT, function (data) {
    console.log("Socket registered - " + socket.id + " " + data);
    devices[data] = socket.id;
  });

  //   Start a session
  socket.on(START_SESSION, function ({ sessiondId, student_name }) {
    if (current_session.sessiondId) {
      // already session is created.
      console.log(
        "Already session is going - " +
          current_session.sessiondId +
          " by " +
          current_session.student_name
      );

      return;
    }
    console.log("Session started - " + sessiondId + " by " + student_name);
    current_session = {
      sessiondId,
      student_name: student_name.trim(),
      timestamp: new Date(),
      assigned: score.assignedPatterns,
      performance_data: {
        total_hits: 0,
        total_success: 0,
        total_wrong: 0,
        points_counter: score.boardPoints.reduce((cur, key) => {
          cur[`${key}`] = 0;
          return cur;
        }, {}),
      },
    };
    console.log(current_session);
  });

  //   Stop a session
  socket.on(STOP_SESSION, function () {
    if (!current_session.sessiondId) {
      // if no session is there.
      console.log("No active session to stop");
      return;
    }
    console.log("Session stopped - " + current_session.sessiondId);
    // computing total failures
    current_session.performance_data.total_wrong =
      current_session.performance_data.total_hits -
      current_session.performance_data.total_success;

    // Appending the current session data to previous list of sessions.
    total_session_data = [current_session, ...total_session_data];

    // Writing to local json copy.
    fs.writeFile(
      FILE_NAME,
      JSON.stringify(total_session_data),
      "utf8",
      () => null
    );

    // resetting the session.
    current_session = {};
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
    io.emit(RESULT, [scoreString]);
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
  if (data !== 14) {
    console.log("board function" + data);
  }

  // console.log(data)
  if (activatedPoint) {
    return;
  }
  if (!swordActivated) {
    activatedPoint = data;
    if (current_session.performance_data) {
      current_session.performance_data.total_hits += 1;
    }
    setTimeout(() => {
      if (activatedPoint) {
        console.log("Board deactivated - " + activatedPoint);

        activatedPoint = null;
      }
    }, SWORD_TIMEOUT_THRESHOLD);
    return;
  }
  successAndReset(data);
};

function reset() {
  console.log("RESETTED");
  activatedPoint = null;
  swordActivated = false;
}

function successAndReset(activatedPoint) {
  if (current_session.performance_data) {
    current_session.performance_data.points_counter[`${activatedPoint}`] += 1;
  }
  if (score.assignedPatterns.includes(activatedPoint)) {
    if (!score.patternFenced.includes(activatedPoint)) {
      score.patternFenced.push(activatedPoint);
    }
    //   Emit success light
    io.emit(LIGHT, 1);
    if (current_session.performance_data) {
      current_session.performance_data.total_success += 1;
    }
  } else {
    //   Emit failure light
    io.emit(LIGHT, 2);
  }
  reset();
}

const onSwordSuccess = (data) => {
  if (swordActivated) {
    return;
  }
  console.log("SWORD" + data);
  console.log(data);
  if (data == 0) {
    if (!activatedPoint) {
      if (current_session.performance_data) {
        current_session.performance_data.total_hits += 1;
      }
      console.log("Sword activated");
      swordActivated = true;
      setTimeout(() => {
        if (swordActivated) {
          console.log("Sword deactivated");
          io.emit(LIGHT, 2);
          swordActivated = false;
        }
      }, SWORD_TIMEOUT_THRESHOLD);
      return;
    }
    successAndReset(activatedPoint);
  }
};

http.listen(PORT, () => console.log("App is running at port " + PORT));
