var mosca = require('mosca')
var sprintf=require("sprintf-js").sprintf;

var settings = {
  port: 1883
};

//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);
  
// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}

// fired when a message is received
server.on('published', function(packet, client) {
  console.log(sprintf('%s: %s', packet.topic, packet.payload));
});