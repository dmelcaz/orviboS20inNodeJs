/**
 * Server.js
 * @author : DiganmeGiovanni | https://twitter.com/DiganmeGiovanni
 * @Created on: 25 Oct, 2014
 */

/* Librerias necesarias para la aplicación */
var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);
var mqtt    = require('mqtt');

var client  = mqtt.connect('mqtt://localhost:1883');


/** *** *** ***
 *  Configuramos el sistema de ruteo para las peticiones web
 *  de manera que sin importar la ruta que el usuario solicite
 *  siempre lo direccionaremos al html del sistema de chat.
 */
app.get('*', function(req, res) {
  res.sendFile( __dirname + '/views/index.html');
});



client.on('connect', function () {
  client.subscribe('s20/#');
  console.log('MQTT client ready!')
});


/** *** *** ***
 *  Configuramos Socket.IO para estar a la escucha de
 *  nuevas conexiones.
 */
io.on('connection', function(socket) {
  
  console.log('New user connected');
  
  client.on('message', function (topic, message) {
    // message is Buffer 
    io.emit(topic, message.toString());
  });
  
  socket.on('s20/command', function(msg) {
    console.log('Command received');
    client.publish('s20/command',msg);
  });

  socket.on('disconnect', function() {
    console.log('User disconnected');
  });
  
});


/**
 * Iniciamos la aplicación en el puerto 3000
 */
http.listen(3000, function() {
  console.log('listening on *:3000');
});