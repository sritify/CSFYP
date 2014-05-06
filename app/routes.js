// app/routes.js
module.exports = function(app, passport) {
	
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	
	
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/home');
		else
			res.render('index.ejs'); // load the index.ejs file
	});

	app.get('/about', function(req, res) {
		res.render('about.ejs'); // load the index.ejs file
	});
	
	app.get('/help', function(req, res) {
		res.render('help.ejs'); // load the index.ejs file
	});
	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/home', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/home', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/home', isLoggedIn, function(req, res) {
		// console.log(req.query);
		// console.log(global);
		// console.log(global.userRoom);
		res.render('home.ejs', {
			user : req.user, // get the user out of session and pass to template
			//room : req.query.id
			numberOfRoom: global.numberOfRoom,
			userRoom: global.userRoom,
			roomInfo: global.roomInfo,
			room: global.room,
			data: global.date,
			filename:  __dirname+ "/../views"+"/header.ejs"
		});
	});
	
	app.get('/roomInfo', function(req, res) {
		//res.writeHead(200, {"Content-Type": "text/json"});
		if(req.query.id){
			console.log(req.query);
		}
		else{
			var json = "";
			if (global.numberOfRoom != 0) {
				for (var i=0; i<global.room.length; i++) {
					json = json + "<tr>";
					json = json + "<td><a href='/whiteboard?id="+global.room[i]+"' class='btn btn-default btn-sm'>Enter</a></td>";
					json = json + "<td>"+global.room[i]+"</td>";
					json = json + "<td>"+"<a href='/user?user="+global.host[global.room[i]]+"'>"+global.host[global.room[i]]+"</a></td>";
					json = json + "<td>"+global.date[global.room[i]]+"</td>";	
					json = json + "<td>";
					for (var j=0;j<global.roomInfo[global.room[i]].length;j++){
						json = json + global.roomInfo[global.room[i]][j] + " ";
					}
					json = json + "</td></tr>";
				}
			}	
			res.send(json);
		}
	});
	
	app.get('/user', isLoggedIn, function(req, res) {
		// console.log(req.query);
		// console.log(global);
		// console.log(global.userRoom);
		var name = req.query.user;
		name = name.toString();
		console.log(global.userRoom);
		console.log(global.userRoom[name]);
		res.render('user.ejs', {
			user : req.user, // get the user out of session and pass to template
			username : req.query.user,
			numberOfRoom: global.numberOfRoom,
			userRoom: global.userRoom[name],
			roomInfo: global.roomInfo,
			room: global.room,
			data: global.date
		});
	});
	
	app.get('/whiteboard', isLoggedIn, function(req, res) {
		console.log(req.user.local.username);
		var id = req.query.id;
		if(global.room.indexOf(id) > -1){
			// if(global.roomInfo[id].indexOf(req.user.local.username)==-1){
			global.roomInfo[id].push(req.user.local.username);		
			res.render('whiteboard.ejs', {
				user : req.user, // get the user out of session and pass to template
				room : id,
				host : global.host[id]
			});
			// }	
			// else{
				// res.redirect('/home?error=1');
			// }
		}
		else{
			res.redirect('/home?error=2');
		}
	});
	
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user, // get the user out of session and pass to template
			numberOfRoom: global.numberOfRoom,
			userRoom: global.userRoom[req.user.local.username],
			roomInfo: global.roomInfo,
			room: global.room,
			data: global.date
		});
	});
	
	app.get('/createroom', isLoggedIn, function(req, res) {
	    var id = req.user.local.username+"_"+Math.random()*0xffffffff;
		global.numberOfRoom++;
		global.host[id]=req.user.local.username;
		global.date[id]=new Date();
		global.editable[id]=true;
		global.selection[id] = {};
		global.json[id] =JSON.stringify({
			objects:[],
			background: "white"
		});
		global.connections[id] = new Array();
		global.canvasCommands[id] = new Array();
		global.chatHistory[id] = new Array();
		global.roomInfo[id] = new Array();	
		global.room.push(id);
		console.log(id);
		if(!global.userRoom[req.user.local.username])
			global.userRoom[req.user.local.username] = new Array();
		global.userRoom[req.user.local.username].push(id);
		res.render('createroom.ejs', {
			user : req.user, // get the user out of session and pass to template
			room : id
		});
	});
	
	app.post('/closeroom', isLoggedIn, function(req, res) {
		console.log(req.body);
	    var id = req.body.id;
		global.numberOfRoom--;
		global.host[id]="";
		global.date[id]="";
		global.editable[id]=true;
		global.selection[id] = {};
		global.json[id] = "";
		global.connections[id] = new Array();
		global.canvasCommands[id] = new Array();
		global.chatHistory[id] = new Array();
		global.roomInfo[id] = new Array();	
        var index = global.room.indexOf(id);
        if (index !== -1) {
            // remove the connection from the pool
			global.room.splice(index, 1);
        }
        var index = global.userRoom[req.user.local.username].indexOf(id);
        if (index !== -1) {
            // remove the connection from the pool
			global.userRoom[req.user.local.username].splice(index, 1);
        }
		res.render('closeroom.ejs', {
			user : req.user, // get the user out of session and pass to template
			room : id
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
