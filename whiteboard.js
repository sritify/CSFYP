#!/usr/bin/env node
/************************************************************************
 *  Copyright 2010-2011 Worlize Inc.
 *  
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ***********************************************************************/
//load websocket library

var WebSocketServer = require('./lib/websocket').server;
//express library use as http server
/* Module dependencies */
var express = require('express');
/* Initializing Express Framework */
var app = express.createServer();


app.configure(function() {
    app.use(express.static(__dirname + "/public"));
    app.set('views', __dirname);
    app.set('view engine', 'ejs'); //change to read ejs
});
app.get('/', function(req, res) { //request, respond
    res.render('index', { layout: false }); 
});
app.listen(80);


var wsServer = new WebSocketServer({
    httpServer: app, //create websocket server    
	
    // Firefox 7 alpha has a bug that drops the
    // connection on large fragmented messages
    fragmentOutgoingMessages: false
});


var connections = [];
var canvasCommands = [];
var chatHistory = [];

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

var i = 1;

wsServer.on('request', function(request) {
    var connection = request.accept('whiteboard', request.origin);
    connections.push(connection);
    
	connection.id = i++;
	console.log(connection.id);
	
    console.log(connection.remoteAddress + " connected - Protocol Version " + connection.websocketVersion);
    
    //Send all the existing canvas commands to the new client
    connection.sendUTF(JSON.stringify({
        msg: "initCommands",
        data: canvasCommands
    }));
	
	connection.sendUTF(JSON.stringify({
        msg: "initCommands",
        data: chatHistory
    }));
	// connection.sendUTF(JSON.stringify({
			// msg: 'image',
			// data: {
				// imageBase64: canvas.toDataURL("image/png"),
				// points: [
					// 0,
					// 0
				// ]
			// }
		// }));
	
	// if(background == null){
		// connection.sendUTF(JSON.stringify({
			// msg: 'bgClear',
		// }));
	// }
	// else{
		// connection.sendUTF(JSON.stringify({
			// msg: 'bgColor',
			// data: {
				// color: background,
			// }
		// }));
    // }
	
	
	// connection.on('adduser', function(username){
		// // store the username in the socket session for this client
		// connection.username = username;
		// console.log(connection.username);
		// // store the room name in the socket session for this client
		// // add the client's username to the global list
		// // usernames[username] = username;
		// // // send client to room 1
		// // socket.join('room1');
		// // // echo to client they've connected
		// // socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// // // echo to room 1 that a person has connected to their room
		// // socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		// connection.emit('updaterooms', rooms, 'room1');
	// });
	
    // Handle closed connections
    connection.on('close', function() {
        console.log(connection.remoteAddress + " disconnected");
        
        var index = connections.indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
            connections.splice(index, 1);
        }
    });
	
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
				connections.forEach(function(destination) {
					
					if(connections.indexOf(destination)!=connections.indexOf(connection))
						destination.sendUTF(message.utf8Data);
					//console.log(message.utf8Data);
                    
                });
				
				if (command.msg !== 'conversation')
					canvasCommands.push(command);
				else
					chatHistory.push(command);
				
                if (command.msg === 'clear') {
                    canvasCommands = [];
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
});

console.log("Whiteboard app ready");


// draw = function(data) {
    // // Set the color
    // var color = data.color;
    // ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
	// ctx.lineWidth = data.width;	
	
    // ctx.beginPath();
    // ctx.lineCap = 'round';
    // var points = data.points;
    // // Starting point
    // ctx.moveTo(points[0], points[1]);
    
    // // Ending point
    // ctx.lineTo(points[2], points[3]);
    
    // ctx.stroke();
// };


// //do sth!!
// image = function(data) {
    
	
	// var points = data.points;
	// var img = new Image;

	// img.src = data.imageBase64;
	
	// ctx.drawImage(img, points[0], points[1], img.width, img.height);

	// var out = fs.createWriteStream(__dirname + '/output.png')
	  // , stream = canvas.createPNGStream();

	// stream.on('data', function(chunk){
	  // out.write(chunk);
	// });	  
	
	// /*
	// imageObj.src = new Buffer('iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAGElEQVQIW2P4DwcMDAxAfBvMAhEQMYgcACEHG8ELxtbPAAAAAElFTkSuQmCC', 'base64');
	// var squid = fs.readFileSync(__dirname + '/images/squid.png');
	// imageObj = new Image;
	// imageObj.src = squid;
	// console.log(imageObj.src);
	
	// imageObj.onload = function () 
	// { 
		// console.log("checked4");
		// if(imageObj.width>800)
			// if(imageObj.width/(800-points[0]) > imageObj.height/(450-points[1]))
				// ctx.drawImage(imageObj, points[0], points[1],800-points[0], (800-points[0])*(imageObj.height/imageObj.width));
			// else	
				// ctx.drawImage(imageObj, points[0], points[1],(450-points[1])*(imageObj.width/imageObj.height), 450-points[1]);
		// else if(imageObj.height>450)
			// if(imageObj.width/(800-points[0]) < imageObj.height/(450-points[1]))
				// ctx.drawImage(imageObj, points[0], points[1],(450-points[1])*(imageObj.width/imageObj.height), 450-points[1]);
			// else
				// ctx.drawImage(imageObj, points[0], points[1],800-points[0], (800-points[0])*(imageObj.height/imageObj.width));
		// else
			// ctx.drawImage(imageObj, points[0], points[1],imageObj.width,imageObj.height);	
			
		// var out = fs.createWriteStream(__dirname + '/output.png')
		  // , stream = canvas.createPNGStream();

		// stream.on('data', function(chunk){
		  // out.write(chunk);
		// });
	// } */
	
	// //var points = data.points;
	
	// /*
	// var url = parse('http://www.artisteer.com/media/p4/images/tutorial/source_image.jpg');
	
	// http.get({
		// path: url.pathname + url.search
	  // , host: url.hostname
	// }, function(res){
	  // var buf = '';
	  // res.setEncoding('binary');
	  // res.on('data', function(chunk){ buf += chunk });
	  // res.on('end', function(){
		// var img = new Image();
		// img.src = new Buffer(buf, 'binary');
		// //img.onload = function () {
			// console.log(new Buffer(buf, 'binary'));
			// ctx.drawImage(img, points[0], points[1], img.width / 4, img.height / 4);
			
			// var out = fs.createWriteStream(__dirname + '/output.png')
			  // , stream = canvas.createPNGStream();

			// stream.on('data', function(chunk){
			  // out.write(chunk);
			// });
		// //};
		
	  // });
	// });
	// */
	
	// /*
	// var squid = fs.readFileSync(__dirname + '/images/squid.png');
	// var img = new Image;
	// console.log(squid);
	// img.src = data.imageBase64;
	//img.src = "data:image/png;base64,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";
	//img.src = new Buffer('R0lGODlhIAAgAOf/ABZDfcYnDNQrDM0uEsgyEM8wFNExC9kwGss1Esw2FNM0F9Y2EM44Fdc4GtE7FwBpuhtlpNs7HQBtvytln90+F89CIOY9HOFBGtRGKtFKI+dGFeBIGwB8v+RMHudOIACCywCDzfdNKeRTKPlOI+1THcBbU/lPKgCJzN5WOhGFydlZORGHxfBVJwCM0PJXIQCOywCPzACQzfhWM/pXJRuKyPtYNQeS0OFgQPhcJv5aMNdkQ/NfJA2T0dZlSQCX0/peKP1bPSSOzPxfKQ+WzflfPfZiLxWV0/pgPgCc0ROXzvxhOPlkKQCd0/lkMfplKl+Gs/xmI/5jQACg1vtmM/1nJN5sT/pmOQGi2ACj0k2QrPxoOy2YyuNvTPpsLQCl2uNwU/5qQ1aQuvxtLvttNc13WvttPP1uL/ptQ/xuNvxuPf5vMPtuQwqn1v1vPgCr2f5wRfxzMP1xTP10MQCu3Px0OOV4Xv51M956Yvt1Rv9zVNx9YwGx5iqn0f93OwCz2/x6M/13Tv94Qvt6QQC13f17NPx7O/l6Tv54Vf58NQC241OgzgC3396BbP99Nv99Pfx8UPt8Vkuk0fZ+VWSeyPuANvx9V/9+RfuAPf9+S0SqwvyBPv5+WOqDZf6CON+Hb/+DQP6DR/yGOWSk1OeIc/6IOvyFYf2IQV2p2P2ISfyIT+mKdP2JUOONesiVfF2s1Di31PuJYvyMQ/+IY/2NRPyNSv6ORfyOUfyMarWdlf6PTOSTfv+QTf6QU/+ObP+RVPyTTf+RW/yRbf2UTvWTcv6VT/6VVvyTdP+WUPuZUPmWdf6XXf2aUfyaWP6bUv6cWvWbgv+dVP+dW/6dYf+eYv2gVfqef/iehf2hW/+hVvyhYv+jXf6jZLy0mv+lbP2nX/ynZrm1p/6oYP2oZ/yobf6pbvCqkP+qb/2qdfytafyucP+vZP+tffyvd/+wbPOvmv6wcv2weP+xc/yzbP20bf6yf/+ze/62dfq1oOy5q/24g/+6f/C7p/S/q/TAsv3Fq////yH5BAEKAP8ALAAAAAAgACAAAAj+AP8JHPjPFcGDCBMiFJViCJIkkRRKTPjggw0kWNi4YePj1MSJEj60gJFEihs/gxLt4YPL38eEQU7QIHllzqBFr8DRW3fu3MuDPHjQeFHSSyZu+vLRY8cOXrx0PwVusWEEBowsrcbFqwePnbl07+LZswf1ZRhFHFaQwQRsWrdxcMeRQ9dO3rx57ba9nDAJwo4xmHgpkyYt27Zv4tChU6dYXDRbHwE84UJiSaBVvooxc3bNm7dw4bxpu+asWCpBH0tw0uACDahdxI4hg0YNGzVqyI7t2oXKUpuPB1SJ0FDEES3YyJIjI/aLFipQl/qMsfJRQJ0vFEjQMTWrlvdasUzVfdJUiM6UNbcOfTSAYlSEC0sahZofqhMlQnbMNDEUrJe1nw2MosICLNiBCCKE/GGHHV00UUkvvdzzDBE/GVDFHQVc4MSCanThhBWVyNILP8lUEkVUA2DASgUKuEAFFD9YAUkpxvQDyyNxABHVPwEMwEgPBHSAwxF5VFLNPpUAskYNOw40gA6eJOABGIC4Uw4eb2ghQ5MEMZCBLjecsc8waZShRAhcHsQAA3rgI8kUU+SAZpoHJZDABj/8MAOdEg0wwgh8TmRBoIQWauihiCaq6KKMvhQQADs=', 'base64');
	//console.log('src:'+new Buffer('R0lGODlhIAAgAOf/ABZDfcYnDNQrDM0uEsgyEM8wFNExC9kwGss1Esw2FNM0F9Y2EM44Fdc4GtE7FwBpuhtlpNs7HQBtvytln90+F89CIOY9HOFBGtRGKtFKI+dGFeBIGwB8v+RMHudOIACCywCDzfdNKeRTKPlOI+1THcBbU/lPKgCJzN5WOhGFydlZORGHxfBVJwCM0PJXIQCOywCPzACQzfhWM/pXJRuKyPtYNQeS0OFgQPhcJv5aMNdkQ/NfJA2T0dZlSQCX0/peKP1bPSSOzPxfKQ+WzflfPfZiLxWV0/pgPgCc0ROXzvxhOPlkKQCd0/lkMfplKl+Gs/xmI/5jQACg1vtmM/1nJN5sT/pmOQGi2ACj0k2QrPxoOy2YyuNvTPpsLQCl2uNwU/5qQ1aQuvxtLvttNc13WvttPP1uL/ptQ/xuNvxuPf5vMPtuQwqn1v1vPgCr2f5wRfxzMP1xTP10MQCu3Px0OOV4Xv51M956Yvt1Rv9zVNx9YwGx5iqn0f93OwCz2/x6M/13Tv94Qvt6QQC13f17NPx7O/l6Tv54Vf58NQC241OgzgC3396BbP99Nv99Pfx8UPt8Vkuk0fZ+VWSeyPuANvx9V/9+RfuAPf9+S0SqwvyBPv5+WOqDZf6CON+Hb/+DQP6DR/yGOWSk1OeIc/6IOvyFYf2IQV2p2P2ISfyIT+mKdP2JUOONesiVfF2s1Di31PuJYvyMQ/+IY/2NRPyNSv6ORfyOUfyMarWdlf6PTOSTfv+QTf6QU/+ObP+RVPyTTf+RW/yRbf2UTvWTcv6VT/6VVvyTdP+WUPuZUPmWdf6XXf2aUfyaWP6bUv6cWvWbgv+dVP+dW/6dYf+eYv2gVfqef/iehf2hW/+hVvyhYv+jXf6jZLy0mv+lbP2nX/ynZrm1p/6oYP2oZ/yobf6pbvCqkP+qb/2qdfytafyucP+vZP+tffyvd/+wbPOvmv6wcv2weP+xc/yzbP20bf6yf/+ze/62dfq1oOy5q/24g/+6f/C7p/S/q/TAsv3Fq////yH5BAEKAP8ALAAAAAAgACAAAAj+AP8JHPjPFcGDCBMiFJViCJIkkRRKTPjggw0kWNi4YePj1MSJEj60gJFEihs/gxLt4YPL38eEQU7QIHllzqBFr8DRW3fu3MuDPHjQeFHSSyZu+vLRY8cOXrx0PwVusWEEBowsrcbFqwePnbl07+LZswf1ZRhFHFaQwQRsWrdxcMeRQ9dO3rx57ba9nDAJwo4xmHgpkyYt27Zv4tChU6dYXDRbHwE84UJiSaBVvooxc3bNm7dw4bxpu+asWCpBH0tw0uACDahdxI4hg0YNGzVqyI7t2oXKUpuPB1SJ0FDEES3YyJIjI/aLFipQl/qMsfJRQJ0vFEjQMTWrlvdasUzVfdJUiM6UNbcOfTSAYlSEC0sahZofqhMlQnbMNDEUrJe1nw2MosICLNiBCCKE/GGHHV00UUkvvdzzDBE/GVDFHQVc4MSCanThhBWVyNILP8lUEkVUA2DASgUKuEAFFD9YAUkpxvQDyyNxABHVPwEMwEgPBHSAwxF5VFLNPpUAskYNOw40gA6eJOABGIC4Uw4eb2ghQ5MEMZCBLjecsc8waZShRAhcHsQAA3rgI8kUU+SAZpoHJZDABj/8MAOdEg0wwgh8TmRBoIQWauihiCaq6KKMvhQQADs=', 'base64'));
	// // img.onload = function () 
	// // { 

		// ctx.drawImage(img, points[0], points[1], img.width, img.height);

		// var out = fs.createWriteStream(__dirname + '/output.png')
		  // , stream = canvas.createPNGStream();

		// stream.on('data', function(chunk){
		  // out.write(chunk);
		// });	  
	

	// // }
	
	// // imageObj.addEventListener('load', function(){
	// // console.log("checked4");
		// // if(imageObj.width>800)
			// // if(imageObj.width/(800-points[0]) > imageObj.height/(450-points[1]))
				// // ctx.drawImage(imageObj, points[0], points[1],800-points[0], (800-points[0])*(imageObj.height/imageObj.width));
			// // else	
				// // ctx.drawImage(imageObj, points[0], points[1],(450-points[1])*(imageObj.width/imageObj.height), 450-points[1]);
		// // else if(imageObj.height>450)
			// // if(imageObj.width/(800-points[0]) < imageObj.height/(450-points[1]))
				// // ctx.drawImage(imageObj, points[0], points[1],(450-points[1])*(imageObj.width/imageObj.height), 450-points[1]);
			// // else
				// // ctx.drawImage(imageObj, points[0], points[1],800-points[0], (800-points[0])*(imageObj.height/imageObj.width));
		// // else
			// // ctx.drawImage(imageObj, points[0], points[1],imageObj.width,imageObj.height);	
	// // });
	// */
	// //console.log(imageObj.width/(800-points[0]), imageObj.height/(450-points[1]));

// };

// bgColor = function(data) {
	// var color = data.color;
	// this.background =  'rgb(' + color.r + "," + color.g + "," + color.b +')';
	// bgctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
	// bgctx.fillRect(0, 0, background.width, background.height);
// };


// drawRect2 = function(data) {
    // //Set the color
	// //var e = event.gesture;
    // var color = data.color;
	
	// var points = data.points;

	// var x = Math.min(points[2],  points[0]),
		// y = Math.min(points[3],  points[1]),
		// w = Math.abs(points[2] - points[0]),
		// h = Math.abs(points[3] - points[1]);

	// //context.clearRect(0, 0, canvas.width, canvas.height);

	// if (!w || !h) {
	// return;
	// }
	
	// ctx.lineWidth = data.width;	
	// if(data.style==1){
		// ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.strokeRect(x, y, w, h);
	// }
	// else{
		// ctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.fillRect(x, y, w, h);		
	// }
// };



// drawSquare2 = function(data) {
    // //Set the color
	// //var e = event.gesture;
    // var color = data.color;
	
	// var points = data.points;

	// var x = Math.min(points[2],  points[0]),
		// y = Math.min(points[3],  points[1]),
		// w = Math.abs(points[2] - points[0]),
		// h = Math.abs(points[3] - points[1]);

	// //context.clearRect(0, 0, canvas.width, canvas.height);

	// if (!w || !h) {
	// return;
	// }
	
	// ctx.lineWidth = data.width;	
	
	// if(data.style==1){
		// ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// var l = Math.min(w, h);
		// if(w < h && points[3] < points[1])
			// ctx.strokeRect(x, points[1] - l, l, l);
		// else if(w > h && points[2] < points[0])
			// ctx.strokeRect(points[0] - l, y , l, l);
		// else
			// ctx.strokeRect(x, y, l, l);
	// }
	// else{
		// ctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// var l = Math.min(w, h);
		// if(w < h && points[3] < points[1])
			// ctx.fillRect(x, points[1] - l, l, l);
		// else if(w > h && points[2] < points[0])
			// ctx.fillRect(points[0] - l, y , l, l);
		// else
			// ctx.fillRect(x, y, l, l);
	// }
	
// };


// drawOval2 = function(data) {
    // //Set the color
	// //var e = event.gesture;
    // var color = data.color;
	
	// var points = data.points;

	// //context.clearRect(0, 0, canvas.width, canvas.height);
		
	// var x = Math.min(points[2],  points[0]),
		// y = Math.min(points[3],  points[1]),
		// w = Math.abs(points[2] - points[0]),
		// h = Math.abs(points[3] - points[1]);

	// if (!w || !h) {
		// return;
	// }

	// var kappa = 0.5522848;
	// var ox = (w / 2) * kappa;
	// var oy = (h / 2) * kappa;
	// var xe = x + w;
	// var ye = y + h;
	// var xm = x + w / 2;
	// var ym = y + h / 2;
	
	// if(data.style==1){
		// ctx.lineWidth = data.width;	
		// ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.beginPath();
		// ctx.moveTo(x, ym);
		// ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		// ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		// ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		// ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		// ctx.closePath();
		// ctx.stroke();
	// }else{
		// ctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.beginPath();
		// ctx.moveTo(x, ym);
		// ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		// ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		// ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		// ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		// ctx.closePath();
		// ctx.fill();	
	// }
// };

   
// drawCircle2 = function(data) {
    // //Set the color
	// //var e = event.gesture;
    // var color = data.color;
	
	// var points = data.points;

	// var x = Math.min(points[2],  points[0]),
		// y = Math.min(points[3],  points[1]),
		// w = Math.abs(points[2] - points[0]),
		// h = Math.abs(points[3] - points[1]);

	// //context.clearRect(0, 0, canvas.width, canvas.height);

	// if (!w || !h) {
	// return;
	// }
	
	// if(data.style==1){
		// ctx.lineWidth = data.width;	
		// ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.beginPath();
		// var l = Math.min(w, h);
		// if(w < h){
			// if(points[3] > points[1])
				// ctx.arc(x + w / 2, points[1] + l/2, l/2, 0, 2 * Math.PI, false);
			// else
				// ctx.arc(x + w / 2, points[1] - l/2, l/2, 0, 2 * Math.PI, false);
		// }
		// else if(w > h){
			// if( points[2] > points[0])
				// ctx.arc(points[0] + l/2, y + h / 2, l/2, 0, 2 * Math.PI, false);
			// else
				// ctx.arc(points[0] - l/2, y + h / 2, l/2, 0, 2 * Math.PI, false);
		// }
		// else
			// ctx.arc(x + w / 2, y + h / 2, l/2, 0, 2 * Math.PI, false);
		// ctx.stroke();
	// }else{
		// ctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
		// ctx.beginPath();
		// var l = Math.min(w, h);
		// if(w < h){
			// if(points[3] > points[1])
				// ctx.arc(x + w / 2, points[1] + l/2, l/2, 0, 2 * Math.PI, false);
			// else
				// ctx.arc(x + w / 2, points[1] - l/2, l/2, 0, 2 * Math.PI, false);
		// }
		// else if(w > h){
			// if( points[2] > points[0])
				// ctx.arc(points[0] + l/2, y + h / 2, l/2, 0, 2 * Math.PI, false);
			// else
				// ctx.arc(points[0] - l/2, y + h / 2, l/2, 0, 2 * Math.PI, false);
		// }
		// else
			// ctx.arc(x + w / 2, y + h / 2, l/2, 0, 2 * Math.PI, false);
		// ctx.fill();	
	// }
// };        


// drawLine2 = function(data) {
    // //Set the color
	// //var e = event.gesture;
    // var color = data.color;
	
	// var points = data.points;

	// //context.clearRect(0, 0, canvas.width, canvas.height);

	// ctx.lineCap = 'round';
	
	// ctx.lineWidth = data.width;	
	// ctx.strokeStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';

	// ctx.beginPath();
	// ctx.moveTo(points[0], points[1]);
	// ctx.lineTo(points[2], points[3]);
	// ctx.stroke();
	// ctx.closePath();
// };
	
// text = function(data) {
	// var color = data.color;
	// var points = data.points;
	// ctx.font = data.font;
	// ctx.fillStyle = 'rgb(' + color.r + "," + color.g + "," + color.b +')';
	// ctx.fillText(data.text, points[0],points[1]);
	
	// var out = fs.createWriteStream(__dirname + '/text.png'),
    // stream = canvas.createPNGStream();

	// stream.on('data', function(chunk){
	  // out.write(chunk);
	// });
// };
	
// erase = function(data) {
	// ctx.globalCompositeOperation = 'destination-out';
    // ctx.lineCap = 'round';
	// ctx.fillStyle = 'rgba(0,0,0,1)';
	
	// ctx.lineWidth = data.width*4;	

    // var points = data.points;
    // // Starting point
    // ctx.beginPath();
    // ctx.moveTo(points[0], points[1]);
    // // Ending point
    // ctx.lineTo(points[2], points[3]);
    // ctx.stroke();
// };


// partErase2 = function(data) {
	// //context.clearRect(0, 0, canvas.width, canvas.height);
	// ctx.globalCompositeOperation = 'destination-out';
	// var points = data.points;
	// var x = Math.min(points[2],  points[0]),
		// y = Math.min(points[3],  points[1]),
		// w = Math.abs(points[2] - points[0]),
		// h = Math.abs(points[3] - points[1]);
	// ctx.fillStyle = 'rgba(0,0,0,1)';
	// ctx.fillRect(x, y, w, h);
	
// };
	
// clear = function() {
    // canvas = new Canvas(800, 450)
  // , ctx = canvas.getContext('2d');
  
	// background = null;

	// savedImages = [];
	// removedImages = [];
	
	// // background.width = background.width;
// };

// bgColor = function(data) {
	// background = data.color;
// };