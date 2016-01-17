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
	}, 500);

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
	}, 500);
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
	}, 500);
};

publishStatus = function() {
	s20.getStatus( function(status) {
		if (status == true)
			clientMQTT.publish('s20/status', 'on');
		else {
			clientMQTT.publish('s20/status', 'off');
		}
		console.log('Sending status')
	});
}

const mqtt    = require('mqtt');
const dgram = require('dgram');

const s20Mac = new Buffer('ACCF23357A9A','hex')
const s20Ip = '192.168.0.193'

var s20 =  new S20(s20Ip, s20Mac);
var clientMQTT  = mqtt.connect('mqtt://localhost:1883');


clientMQTT.on('connect', function () {
	clientMQTT.subscribe('s20/command');
	console.log('Client ready!')

	// Cada 5 segundos actualiza el stado
	setInterval(function() {
		publishStatus();
	}, 10000);
});


clientMQTT.on('message', function(topic, msg) {

	if (topic == 's20/command') {

		if (msg.toString() == 'requestStatus'){
			console.log('Status request received');
			publishStatus();

		} else if (msg.toString() == 'changeStatus') {
			console.log('Status change request received');
			s20.getStatus( function(status) {
				if (status != null) {
					s20.subscribe( function() {
						s20.setStatus(!status, function() {
							publishStatus();
						});
					});
				};
			});
		}
	}
})

