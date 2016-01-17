const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const subscription = new Buffer('6864001e636cACCF23357A9A2020202020209a7a3523cfac202020202020','hex');

client.on('message', function(msg, rinfo) {
	console.log('server got: ', msg, ' from ', rinfo.address, ':', rinfo.port);
	console.log('Turn on')
	client.send(poweron, 0, poweron.length, 10000, '192.168.0.193');
});

client.on('listening', function() {
  var address = client.address();
  console.log('server listening ', address.address, ':', address.port);
});

client.bind(10000, function() {
	console.log('subscription');
	client.send(subscription, 0, subscription.length, 10000, '192.168.0.193');
});
