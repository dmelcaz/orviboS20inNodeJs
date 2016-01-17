
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const discoverS20 = new Buffer('686400127167ACCF23357A9A202020202020','hex');
const subscription = new Buffer('6864001e636cACCF23357A9A2020202020209a7a3523cfac202020202020','hex');
const poweron = new Buffer('686400176463ACCF23357A9A2020202020200000000000','hex');

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
	client.send(subscription, 0, subscription.length, 10000, '192.168.0.193', function() {
		//
		client.on('message', function(msg, rinfo) {
			console.log('Turn on')
			client.send(poweron, 0, poweron.length, 10000, '192.168.0.193', function() {
				client.on('message', function(msg, rinfo) {
					client.close();
				});
			});
		});
	});

});
