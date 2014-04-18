#!/usr/bin/env node
// server.js
// Array.prototype.remove = function() {
    // var what, a = arguments, L = a.length, ax;
    // while (L && this.length) {
        // what = a[--L];
        // while ((ax = this.indexOf(what)) !== -1) {
            // this.splice(ax, 1);
        // }
    // }
    // return this;
// };

// set up ======================================================================
// get all the tools we need
var WebSocketServer = require('./lib/websocket').server;
var express  = require('express');
var app      = express.createServer();
var port     = 80;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms
	app.use(express.static(__dirname + "/public"));
	app.set("view options", { layout: false }); 
	app.set('views', __dirname+ "/views");
	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);

var wsServer = new WebSocketServer({
    httpServer: app, //create websocket server    
	
    // Firefox 7 alpha has a bug that drops the
    // connection on large fragmented messages
    fragmentOutgoingMessages: false
});

//console.log(wsServer);


// var Canvas = require('./canvas')
  // , Image = Canvas.Image
  // , canvas = new Canvas(800, 450)
  // , ctx = canvas.getContext('2d')
  // , http = require('http')
  // , parse = require('url').parse
  // , fs = require('fs');
  
var background = null;
var currentimage = "";
var savedImages = [];
var removedImages = [];

// console.log(savedImages);

// ctx.fillRect(0,0,150,150);   // Draw a rectangle with default settings
// ctx.save();                  // Save the default state

// ctx.fillStyle = '#09F'       // Make changes to the settings
// ctx.fillRect(15,15,120,120); // Draw a rectangle with new settings

// ctx.save();                  // Save the current state
// ctx.fillStyle = '#FFF'       // Make changes to the settings
// ctx.globalAlpha = 0.5;    
// ctx.fillRect(30,30,90,90);   // Draw a rectangle with new settings

// ctx.restore();               // Restore previous state
// ctx.fillRect(45,45,60,60);   // Draw a rectangle with restored settings

// ctx.restore();               // Restore original state
// ctx.fillRect(60,60,30,30); 
global.host = new Array();
global.connections = new Array();
//var connections = [];
global.canvasCommands = new Array();
//var canvasCommands = [];
global.chatHistory = new Array();
//var chatHistory = [];
global.numberOfRoom = 0;
global.roomInfo = new Array();
global.userRoom = new Array();
global.room = new Array();
global.date = new Array();
var id = 0;

wsServer.on('request', function(request) {
    var connection = request.accept('whiteboard', request.origin);
    // console.log(request);
	// console.log(request.protocol);
	
    console.log(connection.remoteAddress + " connected - Protocol Version " + connection.websocketVersion);
    
    // //Send all the existing canvas commands to the new client
    // connection.sendUTF(JSON.stringify({
        // msg: "initCommands",
        // data: canvasCommands
    // }));
	
	// connection.sendUTF(JSON.stringify({
        // msg: "initCommands",
        // data: chatHistory
    // }));
	
    // Handle closed connections
	
	// connection.on('update', function() {
		// var command = JSON.parse(message.utf8Data);
		// currentimage = command.data.imageBase64;
    // });
    
    // Handle incoming messages
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			//console.log(connections.indexOf(connection));
            try {
                var command = JSON.parse(message.utf8Data);
				//console.log(command);
				
				// if(command.msg === 'undo'){
					// removedImages.push(canvas.toDataURL("image/png"));
					// connections.forEach(function(destination) {
						// destination.sendUTF(JSON.stringify({
							// msg: 'clear',
						// }));
					// });
					// var saved = savedImages.pop();
					// connections.forEach(function(destination) {
						// destination.sendUTF(JSON.stringify({
							// msg: 'image',
							// data: {
								// imageBase64: saved,
								// points: [
									// 0,
									// 0
								// ]
							// }
						// }));
					// });
					// var img = new Image;
					// img.src = saved;

					// ctx.drawImage(img, 0,0);

					// var out = fs.createWriteStream(__dirname + '/output.png')
					  // , stream = canvas.createPNGStream();

					// stream.on('data', function(chunk){
					  // out.write(chunk);
					// });	  
					
					// return;
				// }
				
				// if(command.msg === 'redo'){
					// //savedImages
					// savedImages.push(canvas.toDataURL("image/png"));
					// connections.forEach(function(destination) {
						// destination.sendUTF(JSON.stringify({
							// msg: 'clear',
						// }));
					// });
					// var saved = removedImages.pop();
					// connections.forEach(function(destination) {
						// connection.sendUTF(JSON.stringify({
							// msg: 'image',
							// data: {
								// imageBase64: saved,
								// points: [
									// 0,
									// 0
								// ]
							// }
						// }));
					// });
					// var img = new Image;
					// img.src = saved;

					// ctx.drawImage(img, 0,0);

					// var out = fs.createWriteStream(__dirname + '/output.png')
					  // , stream = canvas.createPNGStream();

					// stream.on('data', function(chunk){
					  // out.write(chunk);
					// });	  
					
					// return;
				// }
				
				
				//console.log(connections[0]);
				//connections[0].sendUTF(message.utf8Data);
				if (command.msg === 'enterRoom'){
					console.log(command.data);
					connection.username = command.data.username;
					connection.room = command.data.room;
					global.connections[connection.room].push(connection);
					// connection.id = id++;
					// console.log(connection.id);
					
					//Send all the existing canvas commands to the new client
					connection.sendUTF(JSON.stringify({
						msg: "initCommands",
						data: global.canvasCommands[connection.room]
					}));
					
					connection.sendUTF(JSON.stringify({
						msg: "initCommands",
						data: global.chatHistory[connection.room]
					}));
				}else{
					if (command.msg !== 'conversation')
						global.canvasCommands[connection.room].push(command);
					else
						global.chatHistory[connection.room].push(command);				
				}
				
				global.connections[connection.room].forEach(function(destination) {
					
					if(global.connections[connection.room].indexOf(destination)!=global.connections[connection.room].indexOf(connection))
						destination.sendUTF(message.utf8Data);
					//console.log(message.utf8Data);
					
				});
				
				if (command.msg === 'clear') {
					global.canvasCommands[connection.room] = [];
					// clear();
				}
				// else if(command.msg !== 'drawRect' && command.msg !== 'drawSquare' && command.msg !== 'drawOval' && command.msg !== 'drawCircle' && command.msg !== 'drawLine' && command.msg !== 'partErase'){
				// canvasCommands.push(command);
					// if(command.msg !== 'draw' && command.msg !=='erase' )
						// savedImages.push(canvas.toDataURL("image/png"));
						// // connections[0].sendUTF(JSON.stringify({
							// // msg: 'update',
						// // }));
					// switch(command.msg){
						// case 'draw':
							// draw(command.data);
							// break;
						// case 'image':
							// image(command.data);
							// break;
						// case 'drawRect2':
							// drawRect2(command.data);
							// break;
						// case 'drawSquare2':
							// drawSquare2(command.data);
							// break;
						// case 'drawOval2':
							// drawOval2(command.data);
							// break;
						// case 'drawCircle2':
							// drawCircle2(command.data);
							// break;
						// case 'drawLine2':
							// drawLine2(command.data);
							// break;
						// case 'text':
							// text(command.data);
							// break;
						// case 'erase':
							// erase(command.data);
							// break;	
						// case 'partErase2':
							// partErase2(command.data);
							// break;		
						// case 'bgColor':
							// bgColor(command.data);
							// break;
					// }
					// //console.log(savedImages);
				// }
				
				//console.log(canvasCommands);
				// rebroadcast command to all clients
			}
			catch(e) {
				console.log(e);
			}
			
        }
    });
	
	connection.on('close', function() {
        console.log(connection.remoteAddress + " disconnected");
        console.log(connection.username);
		console.log(global.roomInfo[connection.room]);
		//global.roomInfo[connection.room].remove();
        var index = global.roomInfo[connection.room].indexOf(connection.username);
        if (index !== -1) {
            // remove the connection from the pool
            global.roomInfo[connection.room].splice(index, 1);
        }
		console.log(global.roomInfo[connection.room]);
        index = global.connections[connection.room].indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
            global.connections[connection.room].splice(index, 1);
        }
    });
});

console.log("Whiteboard app ready");
