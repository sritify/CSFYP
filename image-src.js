
/**
 * Module dependencies.
 */

var Canvas = require('./canvas')
  , Image = Canvas.Image
  , canvas = new Canvas(200, 200)
  , ctx = canvas.getContext('2d')
  , http = require('http')
  , url = require('url')
  , fs = require('fs');

// ctx.fillRect(0,0,150,150);  
// ctx.save();                 
                            
// ctx.fillStyle = '#09F'      
// ctx.fillRect(15,15,120,120);
                            
// ctx.save();                 
// ctx.fillStyle = '#FFF'      
// ctx.globalAlpha = 0.5;      
// ctx.fillRect(30,30,90,90);  
                            
// ctx.restore();              
// ctx.fillRect(45,45,60,60);  
                            
// ctx.restore();              
// ctx.fillRect(60,60,30,30);  

// var img = new Image;
// img.src = canvas.toBuffer();
// console.log(img.src);
// ctx.drawImage(img, 0, 0, 50, 50);
// ctx.drawImage(img, 50, 0, 50, 50);
// ctx.drawImage(img, 100, 0, 50, 50);

// var squid = fs.readFileSync(__dirname + '/images/squid.png');
// img = new Image;
// img.src = squid;
// console.log(img.src);
// ctx.drawImage(img, 30, 50, img.width / 4, img.height / 4);

http.get(
    {
        host: 'farm8.staticflickr.com',
        port: 80,
        path: '/7108/7038906747_69a526f070_z.jpg'
    },
    function(res) {
        var data = new Buffer(parseInt(res.headers['content-length'],10));
		var pos = 0;
		res.on('data', function(chunk) {
		  chunk.copy(data, pos);
		  pos += chunk.length;
		});
		res.on('end', function () {
		  img = new Image;
		  img.src = data;
		  img.onload =function(){
		  ctx.drawImage(img, 0, 0, img.width, img.height);
		  var out = fs.createWriteStream(__dirname + '/my-out.png')
			, stream = outCanvas.createPNGStream();

		  stream.on('data', function(chunk){
			out.write(chunk);
		  });
		  };
		});
	}
);


var out = fs.createWriteStream(__dirname + '/image-src.png')
  , stream = canvas.createPNGStream();

stream.on('data', function(chunk){
  out.write(chunk);
});