
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const discover = new Buffer('686400067161','hex');

client.on('message', function(msg, rinfo) {
	console.log('server got: ', msg, ' from ', rinfo.address, ':', rinfo.port);
});

client.bind(10000, function() {
	client.setBroadcast(true);
	client.send(message, 0, message.length, 10000, '255.255.255.255' , function(err) {
		
	});
});