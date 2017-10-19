const http = require('http');
const socketio = require('socket.io');
const xxh = require('xxhashjs');
const fs = require('fs');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
  fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
    // if err, throw it for now
    if (err) {
      throw err;
    }
    res.writeHead(200);
    res.end(data);
  });
};

// get random number
const getRandom = (min, max) => (Math.random() * (max - min)) + min;

// size of the ball that should decrease over time/if certain conditions are met
let size = 100;

// score of the players
let score = 0;

// movement vector for ball
const vector = {
  x: getRandom(1, 5),
  y: getRandom(1, 5),
};


// the server should maintain a ball that bounces around and can be interacted with
const ball = {
  x: 250,
  y: 250,
  height: size,
  width: size,
};

const app = http.createServer(handler);
const io = socketio(app);

app.listen(PORT);


const moveBall = () => {
  // bounce ball back if it is hitting the edges and reset size
  if (ball.x <= 0 || ball.x >= 1080 - size) {
    vector.x *= -1;
    ball.x += vector.x;
    size = 100;
    score = 0;
  } else if (ball.y <= 0 || ball.y >= 720 - size) {
    vector.y *= -1;
    ball.y += vector.y;
    size = 100;
    score = 0;
  } else {
    ball.x += vector.x;
    ball.y += vector.y;
  }
};

const resetBall = () => {
  ball.x = 540;
  ball.y = 360;
  size = 100;
  ball.width = size;
  ball.height = size;
  score = 0;
};

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xABCDEF01).toString(16);

  // give socket unique id with date as well, then hex seed
  socket.square = {
    hash,
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 250,
    height: 100,
    width: 25,
    prevX: 0,
    prevY: 0,
    destX: 0,
    destY: 250,
    alpha: 0,
  };

  socket.emit('joined', socket.square);

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();
    socket.broadcast.to('room1').emit('updatedMovement', socket.square);
  });

  socket.on('ballCollision', () => {
  // console.log("received collision");
  // when there is a collision, send the ball back the opposite direction


    vector.x *= -1;
    vector.y *= -1;

    ball.x += vector.x;
    ball.y += vector.y;

    // decrement the ball size
    // logic check - size should not be too small

    if (size > 10) --size;
    ball.width = size;
    ball.height = size;

    // the smaller the size of the ball, the higher the score
    score += 100 / size;
  });

  socket.on('resetBall', () => {
    resetBall();

    io.sockets.emit('ballMovement', ball);
    moveBall();
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.square.hash);

    socket.leave('room1');
  });
});


// first ball movement to kick off 
io.sockets.emit('ballMovement', ball);
io.sockets.emit('scoreUpdate', score);


setInterval(() => {
  io.sockets.emit('ballMovement', ball);
  moveBall();
  io.sockets.emit('scoreUpdate', score);
}, 10);

console.log(`listening on port ${PORT}`);
