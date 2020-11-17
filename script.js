/* Main definitions */
const socket = io();
const W = 87;
const A = 65;
const S = 83;
const D = 68;
/* Setup */
function setup() {
  // Create the canvas
  createCanvas(600, 600);
  // Remove outline on players
  noStroke();
};

function randomCol() {
  return {r:Math.random()*255, g:Math.random()*255, b:Math.random()*255};
}
function randomPos() {
  return {x:Math.random()*600, y:Math.random()*600};
}

socket.on('pong', () => {
  latency = Date.now() - startTime;
  document.getElementById('ping').innerHTML = `Ping: ${latency}ms`
});
socket.on('radio', radio => {
  console.log(radio);
});

function movement(){
    if(keyIsDown(W)) data.players[socket.id].pos.y -= data.players[socket.id].speed;
    if(keyIsDown(A)) data.players[socket.id].pos.x -= data.players[socket.id].speed;
    if(keyIsDown(S)) data.players[socket.id].pos.y += data.players[socket.id].speed;
    if(keyIsDown(D)) data.players[socket.id].pos.x += data.players[socket.id].speed;
    draw();
    
}

function draw(){
    // Clear everything
    background(50);
    
    // Update info
    const me = data.players[socket.id].pos;
    document.getElementById('count').innerHTML = `${Object.keys(data.players).length} player(s)`;
    document.getElementById('pos').innerHTML = `Position: ${Math.round(me.x)}, ${Math.round(me.y)}`;
    
     for(let playerID of Object.keys(data.players)) {
        // Get the the player from the player's id
        let player = data.players[playerID];

        // Draw the player
        fill(player.color.r, player.color.g, player.color.b);
        rect(player.pos.x, player.pos.y, player.size, player.size);
    }
    
}

/* Update & Events */

// Client side movement
setInterval(movement, 10);

// Get the update from the server
socket.on("update", rdata => {
  window.data = rdata;

  // Check if the movement keys are pressed, if so then send an event
  if(keyIsDown(W)) socket.emit("move", W);
  if(keyIsDown(A)) socket.emit("move", A);
  if(keyIsDown(S)) socket.emit("move", S);
  if(keyIsDown(D)) socket.emit("move", D);

  
  // Display each player
  draw();
});

socket.on('connect', () => {
  document.title = "Dukemz's Game Experiment";
  console.log("Socket connected.");

  window.pingInterval = setInterval(function() {
    window.startTime = Date.now();
    socket.emit('ping');
  }, 2000);
});

socket.on('disconnect', () => {
  background(50);
  document.title = "DGE (not connected)";
  console.log("Socket disconnected.");
  clearInterval(pingInterval);
  alert("The websocket was closed - the server may be offline.");

  document.getElementById('ping').innerHTML = `Ping: ---ms`;
  document.getElementById('count').innerHTML = `0 player(s)`;
  document.getElementById('pos').innerHTML = `Position: ---, ---`
});
