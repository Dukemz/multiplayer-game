



const express = require('express');
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const readline = require('readline');

// Run eval commands
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});
rl.on('line', line => { try {
  console.log(eval(line));
} catch(err) { console.error(err) }
});
console.log("Eval input ready.");

// app.use(express.static("public"));

app.get('*', function(req, res) {
  const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.ip;
  console.log(`GET request to [${req.url}] from ${ip}`)
  if(req.url === '/favicon.ico' || req.url === '/index.js') {
    return res.status(418).send("You can't brew coffee here!");
  }
  if(req.url.includes('package') || req.url.includes('node_modules')) return res.send("No touching.");
  res.sendFile(__dirname + req.url);
});

/* Server */
let updateInterval;

function disconnectAll() {
  console.log("Disconnecting all players...");
  let n = 0;
  const socks = Array.from(io.sockets.sockets.values());
  for(i in socks) {
    const p = socks[i];
    p.disconnect();
    n++;
  }
  return n+1;
}

// Movement keys
const W = 87;
const A = 65;
const S = 83;
const D = 68;

// The data
let data = {players:{}};

let width = 600;
let height = 600;

io.on("connection", socket => {
  // New player connected
  console.log(`Player connected (id ${socket.id}).`);

  // Create new player
  data.players[socket.id] = {
    name: "Unnamed",
    pos: {x:Math.random()*584, y:Math.random()*584},
    speed: 2,
    size: 16,
    color: {r:Math.random()*255, g:Math.random()*255, b:Math.random()*255},
    namecol: {r:255, g:255, b:255}
  };

  socket.on('ping', function() {
    socket.emit('pong');
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected (id ${socket.id}).`);
    // clearInterval(updateInterval);
    // Delete player
    delete data.players[socket.id];
  });
  // Movement event
  socket.on("move", key => {
    // Get the current player
    let player = data.players[socket.id];

    // Check which movement key was pressed, and move accordingly
    if(key == W) player.pos.y -= player.speed;
    if(key == A) player.pos.x -= player.speed;
    if(key == S) player.pos.y += player.speed;
    if(key == D) player.pos.x += player.speed;

    // Check if player is touching the boundary, if so stop them from moving past it
    if(player.pos.x > width - player.size) player.pos.x = width - player.size;
    if(player.pos.x < 0) player.pos.x = 0;
    if(player.pos.y > height - player.size) player.pos.y = height - player.size;
    if(player.pos.y < 0) player.pos.y = 0;
  });

  socket.on("name", name => {
    let player = data.players[socket.id];
    // Remove non-ascii and limit name to 15 characters
    const cleanname = name.replace(/[^\x20-\x7E]/g, '').substring(0, 15);
    player.name = cleanname || "Unnamed";
  });

  socket.on("msg", msg => {
    console.log(`Message from ${socket.id}: ${msg}`);
    io.sockets.emit('radio', `Message from ${socket.id}: ${msg}`);
  });
  /*
  socket.on("eval", evalc => {
    console.log(`Evaluating remote code sent from ${socket.id}: ${evalc}`);
    try {
      const test = eval(evalc);
      console.log(test);
      socket.emit('radio', test);
    } catch(err) {
      console.error("ERROR");
      console.error(err);
      socket.emit('radio', err.stack);
    }
  });
  */
  // Modify a user's properties
  socket.on("modify", playerm => {
    if(typeof playerm !== "object") return;
    console.log(`Modifying data for ${socket.id}: ${JSON.stringify(playerm)}`);
    const playerd = data.players[socket.id];
    // Update the data
    data.players[socket.id] = {...playerd, ...playerm}
  });
});
http.listen(3000, () => {
  console.log("Server online - listening on port 3000.");
  updateInterval = setInterval(() => io.sockets.emit('update', data), 10);
});
