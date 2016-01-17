
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const discoverS20 = new Buffer('686400127167ACCF23357A9A202020202020','hex');

client.on('message', function(msg, rinfo) {
	console.log('server got: ', msg, ' from ', rinfo.address, ':', rinfo.port);
});

client.on('listening', function() {
  var address = client.address();
  console.log('server listening ', address.address, ':', address.port);
});

client.bind(10000, function() {
	client.setBroadcast(false);
	
	console.log('subscription');
	client.send(discoverS20, 0, discoverS20.length, 10000, '192.168.0.193');

});
