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
/* // get random number
const getRandom = (min, max) => (Math.random() * (max - min)) + min;
// size of the ball that should decrease over time/if certain conditions are met
const size = 100;
// movement vector for ball
const vector = {
  x: getRandom(1, 10),
  y: getRandom(1, 10),
};


// the server should maintain a ball that bounces around and can be interacted with
const ball = {
  x: getRandom(1, 500),
  y: getRandom(1, 500),
  height: size,
  width: size,
}; */

/* const moveBall = () => {
  // for now, bounce ball back if it is hitting the edges
  if (ball.x <= 0 || ball.x >= 500) {
    vector.x *= -1;
    ball.x += vector.x;
  } else if (ball.y <= 0 || ball.y >= 500) {
    vector.y *= -1;
    ball.y += vector.y;
  } else {
    ball.x += vector.x;
    ball.y += vector.y;
  }
}; */

const app = http.createServer(handler);
const io = socketio(app);

app.listen(PORT);


io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');

  const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xABCDEF01).toString(16);
  let xPos = 0;
  // use the hash odd/even to determin which side user should start on
  switch (hash % 2) {
    case 1:
      xPos = 475;
      break;
    default:
      xPos = 0;
      break;
  }

  // give socket unique id with date as well, then hex seed
  socket.square = {
    hash,
    lastUpdate: new Date().getTime(),
    x: xPos,
    y: 250,
    height: 100,
    width: 25,
    prevX: 0,
    prevY: 0,
    destX: xPos,
    destY: 250,
    alpha: 0,
  };

  socket.emit('joined', socket.square);

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();
    socket.broadcast.to('room1').emit('updatedMovement', socket.square);
  });


  /* setInterval(() => {
    moveBall();
    io.sockets.emit('ballMovement', ball);
  }, 100); */

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.square.hash);

    socket.leave('room1');
  });
});

console.log(`listening on port ${PORT}`);
