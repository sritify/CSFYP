#!/usr/bin/env node
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
  
global.host = new Array();
global.connections = new Array();
global.editable = new Array();
global.json = new Array();
global.selection = new Array();
global.canvasCommands = new Array();
global.chatHistory = new Array();
global.numberOfRoom = 0;
global.roomInfo = new Array();
global.userRoom = new Array();
global.room = new Array();
global.date = new Array();

var id = 0;

wsServer.on('request', function(request) {
    var connection = request.accept('whiteboard', request.origin);
    console.log(connection.remoteAddress + " connected - Protocol Version " + connection.websocketVersion);
    
    // Handle incoming messages
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
			//console.log(connections.indexOf(connection));
            try {
                var command = JSON.parse(message.utf8Data);
				//console.log(command);	
				//console.log(connections[0]);
				//connections[0].sendUTF(message.utf8Data);
				
				if(command.msg === 'save'){
					global.json[connection.room] = command.data.json;
					global.canvasCommands[connection.room] = new Array();
					return;  //return for save command, need not process and broadcast
				}		
				
				if (command.msg === 'enterRoom'){
					//console.log(command.data);
					connection.username = command.data.username;
					connection.room = command.data.room;
					global.connections[connection.room].push(connection);
					// connection.id = id++;
					// console.log(connection.id);
					
					connection.sendUTF(JSON.stringify({
						msg: "initial",
						data: {
							json: global.json[connection.room]
						}
					}));
	
					//console.log(global.canvasCommands[connection.room]);
					
					//Send all the existing canvas commands to the new client
					connection.sendUTF(JSON.stringify({
						msg: "initCommands",
						data: global.canvasCommands[connection.room]
					}));
					
					connection.sendUTF(JSON.stringify({
						msg: "initCommands",
						data: global.chatHistory[connection.room]
					}));
					
					//console.log(global.selection[connection.room]);
					
					connection.sendUTF(JSON.stringify({
						msg: "selection",
						data: {
							json: global.selection[connection.room]
						}
					}));
					
					if(global.editable[connection.room] == false){
						connection.sendUTF(JSON.stringify({
							msg: 'disable',
							data: {
								host:  global.host[connection.room]
							}
						}));
					}
				}else{
					if (command.msg !== 'conversation')
						global.canvasCommands[connection.room].push(command);
					else
						global.chatHistory[connection.room].push(command);				
				}
				
				//boardcast the message
				global.connections[connection.room].forEach(function(destination) {	
					if(global.connections[connection.room].indexOf(destination)!=global.connections[connection.room].indexOf(connection))
						destination.sendUTF(message.utf8Data);
					//console.log(message.utf8Data);				
				});
				
				//process the message if needed
				if (command.msg === 'disable') {
					global.editable[connection.room] = false;
					return;
				}
				
				if (command.msg === 'enable') {
					global.editable[connection.room] = true;
					return;
				}
				
				if (command.msg === 'groupCreate') {
					global.selection[connection.room][command.data.id] = [false, command.data.user];
					connection.groupid = command.data.id;
					connection.groupArray = command.data.array;
					//var array = command.data.array;
					// for(var i=0;i<array.length;i++)
						// global.selection[connection.room][array[i]] = [false, command.data.user];
					//console.log(global.selection[connection.room]);
					return;
				}
				
				if (command.msg === 'groupCancel') {
					global.selection[connection.room][command.data.id] = [true, command.data.user];
					connection.groupid = '';
					//console.log(global.selection[connection.room]);
					return;
				}
				
				if (command.msg === 'selected') {
					global.selection[connection.room][command.data.id] = [false, command.data.user];
					//console.log(global.selection[connection.room]);
					return;
				}
				
				if (command.msg === 'unselected') {
					global.selection[connection.room][command.data.id] = [true, command.data.user];
					//console.log(global.selection[connection.room]);
					return;
				}
			}
			catch(e) {
				console.log(e);
			}
			
        }
    });
	
	connection.on('close', function() {
		var index = global.roomInfo[connection.room].indexOf(connection.username);
        if (index !== -1) {
            // remove the connection from the pool
            global.roomInfo[connection.room].splice(index, 1);
        }
        //console.log(connection.remoteAddress + " disconnected");
        //console.log(connection.username);
		//console.log(global.roomInfo[connection.room]);
        //set server list, send unselect to all client
		//cancel group....
		if(connection.groupid != ''){
			global.canvasCommands[connection.room].push({
				msg: 'groupCancel',
				data: {
					id: connection.groupid,
					array: [],
					user: connection.username
				}
			});
			
			console.log(global.canvasCommands[connection.room]);
		
			global.selection[connection.room][connection.groupid][0] = true;
			global.connections[connection.room].forEach(function(destination) {	
				if(global.connections[connection.room].indexOf(destination)!=global.connections[connection.room].indexOf(connection))
					destination.sendUTF(JSON.stringify({
						msg: 'groupCancel',
						data: {
							id: connection.groupid,
							array: [],
							user: connection.username
						}
					}));
			
				for(var i=0;i<connection.groupArray.length;i++){
					global.selection[connection.room][connection.groupArray[i]][0] = true;
					if(global.connections[connection.room].indexOf(destination)!=global.connections[connection.room].indexOf(connection))
						destination.sendUTF(JSON.stringify({
							msg: 'unselected',
							data: {
								id: connection.groupArray[i],
								user: connection.username
							}	
						}));					
				}
			});
		}
		
		for(var id in global.selection[connection.room]){
			if(global.selection[connection.room][id][1]==connection.username){
				if(global.selection[connection.room][id][0] == false){
					global.selection[connection.room][id][0] = true;
					global.connections[connection.room].forEach(function(destination) {	
						if(global.connections[connection.room].indexOf(destination)!=global.connections[connection.room].indexOf(connection))
							destination.sendUTF(JSON.stringify({
								msg: 'unselected',
								data: {
									id: id,
									user: connection.username
								}	
							}));			
					});
				}
			}
		}

		//console.log(global.roomInfo[connection.room]);
        index = global.connections[connection.room].indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
            global.connections[connection.room].splice(index, 1);
        }
    });
});

console.log("Whiteboard app ready");
