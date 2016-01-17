function S20 (ip, mac) {
    this.ip = ip;
	this.mac = mac;
};

// Sbubscripción
S20.prototype.subscribe = function(callback) {

	// Creación del socket
	const client = dgram.createSocket('udp4');

	var self = this;
	var subscribed = null;

	// Buffers para generar el paquete de datos
	const reversemac = new Buffer(self.mac.toString('hex').match(/.{2}/g).reverse().join(""),'hex');
	const bufferMagicCommand = new Buffer('6864001e636c','hex');
	const bufferPadding = new Buffer('202020202020','hex');

	// Generación del paquete
	const bufferPacket =  new Buffer.concat([bufferMagicCommand,self.mac,bufferPadding,reversemac,bufferPadding]);

	client.bind(10000, function() {
			
		// Envio de la petición de encendido
		client.send(bufferPacket, 0, bufferPacket.length, 10000, self.ip, function() {

			//Espero una respuestas	
			client.on('message', function(msg, rinfo) {
				// Si la respuesta es la correcta
				if (msg[4] == 0x63 && msg[5] == 0x6c) {

					// Si se realiza la subscripción al S20
					if (msg[22] == 0x00) {
						subscribed = true;
					// La respuesta no es la esperada :(
					} else {
						subscribed = false;
					}
				}
			});
		});
	});

	// Pongamos un timeout
	setTimeout(function() {
		client.close();
		if (callback)
			callback(subscribed);
		return subscribed;
	}, 1000);

};

S20.prototype.setStatus = function(turnOn, callback) {

	// Creación del socket
	const client = dgram.createSocket('udp4');

	var self = this;
	var isStatusSet = null;

	// Si deseamos encender el S20
	if (turnOn == true) {
		// Estado deseado y buffer para generar el paquete de datos
		desiredStatus = 0x01;
		var bufferStatus = new Buffer('01','hex');

	// Si deseamos apagar el S20
	} else {

		// Estado deseado y buffer para generar el paquete de datos
		desiredStatus = 0x00;
		var bufferStatus = new Buffer('00','hex');
	}

	// Buffers para generar el paquete de datos
	const bufferMagicCommand = new Buffer('686400176463','hex');
	const bufferPadding = new Buffer('20202020202000000000','hex');
	setStatus = new Buffer.concat([bufferMagicCommand,self.mac,bufferPadding,bufferStatus]);

	client.bind(10000, function() {
		client.setBroadcast(false);
			
		// Envio de la petición de encendido
		client.send(setStatus, 0, setStatus.length, 10000, self.ip, function() {

			//Espero una respuestas
			client.on('message', function(msg, rinfo) {

				// Si la respuesta es la correcta
				if (msg[4] == 0x73 && msg[5] == 0x66) {

					// Si apagamos el S20
					if (msg[22] == desiredStatus) {
						isStatusSet = true

					// La respuesta no es la esperada :(
					} else {
						isStatusSet = false;
					}
				}
	
			});
		});
	});

	// Pongamos un timeout
	setTimeout(function() {
		client.close();
		if (callback)
			callback(isStatusSet);
		return isStatusSet;
	}, 1000);
};

S20.prototype.getStatus = function(callback) {

	// Creación del socket
	const client = dgram.createSocket('udp4');

	var self = this;
	var status = null

	// Buffers para generar el paquete de datos
	const bufferMagicCommand = new Buffer('686400127167','hex');
	const bufferPadding = new Buffer('202020202020','hex');

	const bufferPacket =  new Buffer.concat([bufferMagicCommand,self.mac,bufferPadding]);

	client.bind(10000, function() {
		client.setBroadcast(false);
			
		// Envio de la petición de encendido
		client.send(bufferPacket, 0, bufferPacket.length, 10000, self.ip, function() {

			//Espero una respuestas
			client.on('message', function(msg, rinfo) {

				// Si la respuesta es la correcta
				if (msg[4] == 0x71 && msg[5] == 0x67) {

					// Si el S20 está apagado
					if (msg[41] == 0x00) {
						currentStatus = false;
					// Si el S20 está encendido
					} else if (msg[41] == 0x01) {
						currentStatus = true;
					}
				}
			});
		});
	});

	// Pongamos un timeout
	setTimeout(function() {
		client.close();
		if (callback)
			callback(currentStatus);
		return currentStatus;
	}, 1000);
};

const dgram = require('dgram');
const mac = new Buffer('ACCF23357A9A','hex')
const ip = '192.168.0.193'

var s20 =  new S20(ip, mac);

s20.getStatus( function(status) {
	if (status != null) {
		console.log('Setting new status')
		s20.subscribe( function() {
			console.log('Subscribed!')
			s20.setStatus(!status, function() {
				console.log('Is powered on?:', !status);
			});
		});
	};
});
