/* Setup */
const socket = io();
function setup() {
  // Create the canvas
  createCanvas(600, 600);
  // Remove outline on players
  noStroke();
};
function randomCol() { return {r:Math.random()*255, g:Math.random()*255, b:Math.random()*255}; }
function randomPos() { return {x:Math.random()*584, y:Math.random()*584}; }

// Create the movement keys
const W = 87;
const A = 65;
const S = 83;
const D = 68;

/* Update & Events */

socket.on('pong', () => { // Event for calculating ping
  latency = Date.now() - startTime;
  document.getElementById('ping').innerHTML = `Ping: ${latency}ms`
});
socket.on('radio', radio => {
  console.log(radio);
});

// This event triggers when recieving an update from the server.
socket.on("update", rdata => {
  
  // Set the local data to the data recieved from the server
  window.data = rdata;
  // Set the background to 50, clearing the canvas
  background(50);

  // Check if the movement keys are pressed, if so then send an event
  if(keyIsDown(W)) socket.emit("move", W);
  if(keyIsDown(A)) socket.emit("move", A);
  if(keyIsDown(S)) socket.emit("move", S);
  if(keyIsDown(D)) socket.emit("move", D);

  const me = data.players[socket.id].pos;
  document.getElementById('count').innerHTML = `${Object.keys(data.players).length} player(s)`;
  document.getElementById('pos').innerHTML = `Position: ${Math.round(me.x)}, ${Math.round(me.y)}`;
  document.getElementById('fps').innerHTML = `${Math.round(frameRate())} FPS`;
  
  // Display each player
  for(let playerID of Object.keys(data.players)) {
    // Get the the player from the player's id
    let player = data.players[playerID];

    // Draw the player
    fill(player.color.r, player.color.g, player.color.b);
    rect(player.pos.x, player.pos.y, player.size, player.size);
    // Draw text above player
    fill(255, 255, 255)
    textSize(player.size);
    textAlign(CENTER);
    text(player.name, player.pos.x + (player.size/2), player.pos.y - 5);
  }
});

socket.on('connect', () => { // Whenever successfully connected to the server
  document.title = "Dukemz's Game Experiment";
  console.log("Socket connected.");
  if(!window.savedName) window.savedName = prompt("Please enter your name.") || "Unnamed";
  socket.emit("name", savedName);

  window.pingInterval = setInterval(function() {
    window.startTime = Date.now();
    socket.emit('ping');
  }, 2000);
});

socket.on('disconnect', () => { // Whenever disconnected from the server
  background(50);
  document.title = "DGE (not connected)";
  console.log("Socket disconnected.");
  clearInterval(pingInterval);
  alert("Disconnected from the server. The game should attempt to automatically reconnect.");

  document.getElementById('ping').innerHTML = `Ping: ---ms`;
  document.getElementById('count').innerHTML = `0 player(s)`;
  document.getElementById('pos').innerHTML = `Position: ---, ---`
});

// socket.address for banning ips