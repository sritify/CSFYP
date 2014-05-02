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
 
function Whiteboard(canvasId) {
	this.auth = Math.random()*0xffffffff+'_';
	this.i=1;
    this.initCanvas(canvasId);
	this.idle=true;
	this.editable=true;
	this.username="";
	this.room="";
	this.autoUpdate;
	this.canvas2 = new fabric.Canvas(canvasId);
	this.canvasScale = 1;
	this.selectList = {};
	
	fabric.Object.prototype.originX = "center"; 
	fabric.Object.prototype.originY = "center";
	
	fabric.Image.fromURL=function(d,f,e){
		var c=fabric.document.createElement("img");
		c.onload=function(){
			if(f){f(new fabric.Image(c,e))}
			c=c.onload=null
		};
		c.setAttribute('crossOrigin','anonymous');
		c.src=d;
	};
	
	this.canvas2.backgroundColor="white";
	
	this.canvas2.on('before:selection:cleared', this.onSelectionCleared.bind(this));
	this.canvas2.on('object:selected', this.onObjectSelected.bind(this));
	this.canvas2.on('object:rotating', this.onObjectRotated.bind(this));
	this.canvas2.on('object:scaling', this.onObjectScaled.bind(this));
	this.canvas2.on('object:moving', this.onObjectMoving.bind(this));
	this.canvas2.on('object:modified', this.onObjectModified.bind(this));
	this.canvas2.on('object:added', this.onObjectAdded.bind(this));
	this.canvas2.on('selection:created', this.onSelectionCreated.bind(this));

	//this.canvas2.on('object:removed', this.onObjectRemoved.bind(this));

    this.messageHandlers = {
        initCommands: this.initCommands.bind(this),
		initial: this.initial.bind(this),
		draw: this.draw.bind(this),
		enable: this.enable.bind(this),
		disable: this.disable.bind(this),
		drawEnd: this.drawEnd.bind(this),
		text: this.text.bind(this),
		bgColor: this.bgColor.bind(this),
        clear: this.clear.bind(this),
		bgClear: this.bgClear.bind(this),
		image: this.image.bind(this),
		type: this.type.bind(this),
		rotate: this.rotate.bind(this),
		groupRotate: this.groupRotate.bind(this),
		scale: this.scale.bind(this),
		rectscale: this.rectscale.bind(this),
		linescale: this.linescale.bind(this),
		circlescale: this.circlescale.bind(this),
		move: this.move.bind(this),
		groupMove: this.groupMove.bind(this),
		selected: this.selected.bind(this),
		unselected: this.unselected.bind(this),
		groupCreate: this.groupCreate.bind(this),
		groupCancel: this.groupCancel.bind(this),
		groupColour: this.groupColour.bind(this),
		groupWidth: this.groupWidth.bind(this),
		create: this.create.bind(this),
		remove: this.remove.bind(this),
		restore: this.restore.bind(this),
		finish: this.finish.bind(this),
		colour: this.colour.bind(this),
		width: this.width.bind(this),
		selection: this.selection.bind(this),
		copy: this.copy.bind(this),
		up: this.up.bind(this),
		down: this.down.bind(this),
		editText:this.editText.bind(this),
		editFontSize:this.editFontSize.bind(this),
		editFontFamily:this.editFontFamily.bind(this),
		editFontWeight:this.editFontWeight.bind(this),
		editFontStyle:this.editFontStyle.bind(this),
		conversation:this.conversation.bind(this)
    };

    // Initial state
    this.lastPoint = null;
    this.mouseDown = false;
    this.color = {
        r: 0,
        g: 0,
        b: 0
    };
	this.background = 'rgb(255,255,255)';
	this.width = 1;
	this.command = 'draw';
	this.style = 1;
	this.context = 'Hello World!';
	this.fontSize = "30";
	this.fontFace = "serif";
	this.fontWeight ="normal";
	this.fontStyle = "normal";
	this.font = this.fontWeight + " " + this.fontStyle + " " + this.fontSize + "px " + this.fontFace;
	this.imageBase64 = null;
	this.currentImage;
	this.savedImages = [];
	this.removedImages = [];
	this.selectedObject = 0;
	this.latexImage = null;
	this.canvas2.renderAll();
	this.canvas2.calcOffset(); 
};

function reset(that, object){
	var scaleX = object.scaleX;
	var scaleY = object.scaleY;
	var left = object.left;
	var top = object.top;
	
	var tempScaleX = scaleX * (1 / that.canvasScale);
	var tempScaleY = scaleY * (1 / that.canvasScale);
	var tempLeft = left * (1 / that.canvasScale);
	var tempTop = top * (1 / that.canvasScale);
	
	object.scaleX = tempScaleX;
	object.scaleY = tempScaleY;
	object.left = tempLeft;
	object.top = tempTop;
	
	object.setCoords();
}

function zoom(that, object){
	var scaleX = object.scaleX;
	var scaleY = object.scaleY;
	var left = object.left;
	var top = object.top;
	
	var tempScaleX = scaleX * that.canvasScale;
	var tempScaleY = scaleY * that.canvasScale;
	var tempLeft = left * that.canvasScale;
	var tempTop = top * that.canvasScale;
	
	object.scaleX = tempScaleX;
	object.scaleY = tempScaleY;
	object.left = tempLeft;
	object.top = tempTop;
	
	object.setCoords();
}

Whiteboard.prototype.onSelectionCreated = function(e) {
	//console.log("selection created");
	activeGroup = this.canvas2.getActiveGroup();
	var that = this;
	if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		activeGroup.id= this.auth+(this.i++);
		var array = new Array();
		objectsInGroup.forEach(function(object) {	
			array.push(object.id);
			//that.selectList[object.id]=[false, that.username];		
		});	 
		this.socket.send(JSON.stringify({
			msg: 'groupCreate',
			data: {
				id: activeGroup.id,
				array: array,
				top: activeGroup.top,
				left: activeGroup.left,
				user: this.username
			}
		}));
		this.selectList[activeGroup.id]=[false, this.username];		
	}
} 

Whiteboard.prototype.onObjectSelected = function(e) {
	if(this.selectedObject != 0){
		this.socket.send(JSON.stringify({
			msg: 'unselected',
			data: {
				id: this.selectedObject,
				user: this.username
			}
		}));
		this.selectList[this.selectedObject]=[true, this.username];
	}
	this.selectedObject = e.target.id;
	if(typeof e.target.id !== "undefined"){
		this.socket.send(JSON.stringify({
			msg: 'selected',
			data: {
				user: this.username,
				id: e.target.id,
				top: e.target.top,
				left: e.target.left,
				angle: e.target.angle
			}
		}));
		this.selectList[e.target.id]=[false, this.username];
	}
	if(e.target.type=='text'){
		var text =  e.target;
		$("#edittext").prop("disabled", false);
		$("#textBox2").val(text.text);
		$("#textSize2").val(text.fontSize);
		$("#textFont2").val(text.fontFamily);
		$("#fontWeight2").val(text.fontWeight);
		$("#fontStyle2").val(text.fontStyle);
		openPopup('texteditor2'); 
	}
	else{
		$("#edittext").prop("disabled", true); 
		closePopup('texteditor2');
	}
}

Whiteboard.prototype.onSelectionCleared = function(e) {
	console.log(e.target);
	
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	
	var that = this;
	if (activeGroup) {
		var array = new Array();
		var objArray = this.canvas2.getObjects();
		for (var j = 0 ; j < objArray.length; j++) {
			array[j]=objArray[j].id;
		}
		this.socket.send(JSON.stringify({
			msg: 'groupCancel',
			data: {
				id: activeGroup.id,
				array: array,
				user: this.username
			}
		}));
		this.selectList[activeGroup.id]=[false, this.username];		
		for(var i =0;i< activeGroup._objects.length;i++){
			this.socket.send(JSON.stringify({
				msg: 'unselected',
				data: {
					id: activeGroup._objects[i].id,
					user: this.username
				}
			}));
			//this.selectList[activeGroup._objects[i].id]=[true, this.username];
		}
		this.canvas2.discardActiveGroup();
		var json = JSON.stringify(this.canvas2.toJSON(['id']));
		this.socket.send(JSON.stringify({
			msg: 'save',
			data: {
				json: json
			}
		}));
	}
	else if (activeObject) {
		this.selectedObject = 0;
		this.socket.send(JSON.stringify({
			msg: 'unselected',
			data: {
				id: activeObject.id,
				user: this.username
			}
		}));
		this.selectList[activeObject.id]=[true, this.username];
	}
	$("#edittext").prop("disabled", true); 
	closePopup('texteditor2');
}

Whiteboard.prototype.onObjectAdded = function(e) {
	if(e.target.type=='path'){
		if(e.target.id!=null){
			return;
		}
		e.target.id = this.auth+(this.i++);
		this.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				type: 'path',
				left: e.target.left,
				top: e.target.top,
				height: e.target.height,
				width: e.target.width,
				stroke: e.target.stroke,
				strokeWidth: e.target.strokeWidth,
				path: e.target.path,
				id: e.target.id 
			}
		}));
		this.socket.send(JSON.stringify({
			msg: 'unselected',
			data: {
				id: e.target.id,
				user: this.username
			}
		}));
		this.selectList[e.target.id]=[true, this.username];
		//console.log(e.target);
		//this.temp = e.target;
	}
}

Whiteboard.prototype.onObjectRotated = function(e) {	
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	
	var that = this;
	if (activeGroup) {
		activeGroup.setCoords();
		this.socket.send(JSON.stringify({
			msg: 'rotate',
			data: {
				id: activeGroup.id,
				top: activeGroup.top,
				left: activeGroup.left,
				angle: activeGroup.getAngle(),
				width: activeGroup.getWidth(),
				height: activeGroup.getHeight()
			}
		}));
		var objectsInGroup = activeGroup.getObjects();
	}
	else if (activeObject) {
		this.socket.send(JSON.stringify({
			msg: 'rotate',
			data: {
				id: e.target.id,
				top: e.target.top,
				left: e.target.left,
				angle: e.target.getAngle(),
				width: e.target.getWidth(),
				height: e.target.getHeight()
			}
		}));
	}
}

Whiteboard.prototype.onObjectScaled = function(e){
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	
	var that = this;
	if (activeGroup) {
		this.socket.send(JSON.stringify({
			msg: 'scale',
			data: {
				type: activeGroup.type,
				id: activeGroup.id,
				top: activeGroup.top,
				left: activeGroup.left,
				width: activeGroup.getWidth(),
				height: activeGroup.getHeight(),
				scaleX: activeGroup.scaleX,
				scaleY: activeGroup.scaleY
			}
		}));
	}
	else 
	if (activeObject) {
		this.socket.send(JSON.stringify({
			msg: 'scale',
			data: {
				type: e.target.type,
				id: e.target.id,
				top: e.target.top,
				left: e.target.left,
				width: e.target.getWidth(),
				height: e.target.getHeight(),
				scaleX: e.target.scaleX,
				scaleY: e.target.scaleY
			}
		}));
	}
}

Whiteboard.prototype.onObjectMoving = function(e){
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	
	var that = this;
	if (activeGroup) {
		var objectsInGroup = activeGroup.getObjects();
		var center = activeGroup.getCenterPoint();
		//this.canvas.discardActiveGroup();
		this.socket.send(JSON.stringify({
			msg: 'move',
			data: {
				id: activeGroup.id,
				top: activeGroup.top,
				left: activeGroup.left,
			}
		}));
	}
	else if (activeObject) {
		this.socket.send(JSON.stringify({
			msg: 'move',
			data: {
				id: e.target.id,
				top: e.target.top,
				left: e.target.left,
			}
		}));
	}
}	

Whiteboard.prototype.onObjectModified = function(e){
	var json = JSON.stringify(this.canvas2.toJSON(['id']));
	if(e.target.type!='group'){
		console.log("modified!");
		this.socket.send(JSON.stringify({
			msg: 'save',
			data: {
				json: json
			}
		}));
	}
	this.removedImages = [];
	this.savedImages.push(this.currentImage);
	this.currentImage = json;
}	

Whiteboard.prototype.conversation = function(data) {
	console.log(data);
	$('#conversation').append('<b>'+data.username + ':</b> ' + data.message + '<br>');
	var objDiv = document.getElementById("conversation");
	objDiv.scrollTop = objDiv.scrollHeight;	
};

Whiteboard.prototype.selection = function(data) {
	console.log(data);
	this.selectList = data.json;
	
	var that = this;
	this.canvas2.forEachObject(function(o) {
		console.log(o.id);
		if(that.selectList[o.id][1]==that.username){
			o.selectable = true;
			//console.log('yeah');
		}
		else{
			o.selectable = that.selectList[o.id][0];
			//console.log('oh...');
		}
	});
}

Whiteboard.prototype.copy = function(data) {
	//console.log();
	console.log(data.newid);
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.oldid){               //gets the object with id ='img1' 
			var object = fabric.util.object.clone(objArray[j]);
			object.set("top", object.top+ 5*this.canvasScale);
			object.set("left", object.left+ 5*this.canvasScale);
			object.id = data.newid;
			this.canvas2.add(object);		
			this.canvas2.renderAll(); 
			this.canvas2.calcOffset();
			break;
		}
	}
	// var object = fabric.util.object.clone(data.obj);
	// object.id = data.newid;	
	// this.canvas2.add(object);
	// this.canvas2.renderAll(); 
	// this.canvas2.calcOffset();
	// http://jsfiddle.net/Kienz/sFGGV/6/
};

Whiteboard.prototype.enable = function(data) {
	if(data.host!=this.username){
		this.idle = true;
		this.editable = true;
		this.canvas2.selection = true;
		this.canvas2.forEachObject(function(o) {
			o.selectable = true;
		});
		//$("#updateMessage").prop("disabled", false); 
		var image = document.getElementById("updateMessage");
		image.src = "/image/green.png";
		image.alt = "Editable";
		image.title= "Editable";						
	}
	else{
		this.autoUpdate = 1;
		document.getElementById( "updateButton" ).value = "Disable Edit";
	}
};

Whiteboard.prototype.disable = function(data) {
	if(data.host!=this.username){
		this.idle = false;
		this.editable = false;
		this.canvas2.selection = false;
		this.canvas2.forEachObject(function(o) {
			o.selectable = false;
		});
		this.canvas2.isDrawingMode = false;
		this.canvas2.off('mouse:up');
		this.canvas2.off('mouse:down');
		this.canvas2.off('mouse:move');
		$("#updateMessage").prop("disabled", true); 
		var image = document.getElementById("updateMessage");
		image.src = "/image/red.png";
		image.alt = "Not Editable";
		image.title= "Not Editable";
	}
	else{
		this.autoUpdate = null;
		document.getElementById( "updateButton" ).value = "Enable Edit";
	}
};

Whiteboard.prototype.groupCreate = function(data) {
	console.log('group create',data.id);
	this.selectList[data.id]=[false, data.user];
	var objArray = this.canvas2.getObjects();
	var array = data.array;
	//console.log(array);
	var group = new fabric.Group();
	group.top = data.top;
	group.left = data.left;
	group.id = data.id;
	for(var i=0;i<array.length;i++){
		this.selectList[array[i]]=[false, data.user];
		for (var j = 0 ; j < objArray.length; j++) {
			if(objArray[j].id ==array[i]){               //gets the object with id ='img1' 		
				group.addWithUpdate(objArray[j]);//,{  //.clone()
					// left: objArray[j].left, //
					// top: objArray[j].top 			//
				// });
				this.canvas2.remove(objArray[j]);				
				break;
			}
		}
	}
	group.selectable = false;
    this.canvas2.add(group);
	group.setCoords();
	
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.groupCancel = function(data) {
	console.log('unselected',data.id);
	this.selectList[data.id]=[true, data.user];
	var objArray = this.canvas2.getObjects();
	var group;
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  	//gets the object with id ='img1'
			group = objArray[j];
			var items = group._objects;
			group._restoreObjectsState();
			this.canvas2.remove(group);
			for(var i = 0; i < items.length; i++) {
			    this.canvas2.add(items[i]);
			}
			break;
		}
	}
	var array = data.array;
	for(var i=0;i<array.length;i++)
		for (var j = 0 ; j < objArray.length; j++) {
			if(objArray[j].id ==array[i]){  	//gets the object with id ='img1'
				objArray[j].moveTo(i);
				objArray[j].setCoords();
				break;
			}
		}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.groupColour = function(data) {
	console.log('groupColour',data.id);
	var objArray = this.canvas2.getObjects();
	var group;
	var that = this;
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  	//gets the object with id ='img1'
			group = objArray[j];
			var objectsInGroup = group.getObjects();
			objectsInGroup.forEach(function(object) {
				if(object.type!=('image')){
					if(!((object.get('fill')=='transparent')||(object.get('fill')==null)))
						object.fill = 'rgb(' + data.color.r + "," + data.color.g + "," + data.color.b +')'; 
					if(object.stroke!='null')
						object.stroke = 'rgb(' + data.color.r + "," + data.color.g + "," + data.color.b +')'; 
				}
			});
			break;
		}
	}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.groupWidth = function(data) {
	console.log('groupWidth',data.id);
	var objArray = this.canvas2.getObjects();
	var group;
	var that = this;
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  	//gets the object with id ='img1'
			group = objArray[j];
			var objectsInGroup = group.getObjects();
			objectsInGroup.forEach(function(object) {
				if(object.type!=('image')&&object.type!=('text')){
					if(object.strokeWidth!=0){
						object.strokeWidth = data.strokeWidth; 
						object.setCoords();
					}
				}
			});
			break;
		}
	}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.selected = function(data) {
	console.log('selected',data.id);
	this.selectList[data.id]=[false, data.user];
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			if(this.canvasScale!=1)
				reset(this, objArray[j]);			
			if(this.idle == true)
				objArray[j].selectable = false;
			objArray[j].top=data.top;
			objArray[j].left=data.left;
			objArray[j].angle=data.angle;
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			break;
		}
	}
};

Whiteboard.prototype.unselected = function(data) {
	console.log('unselected',data.id);
	this.selectList[data.id]=[true, data.user];
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			if(this.idle == true)
				objArray[j].selectable = true;
			break;
		}
	}
};

Whiteboard.prototype.restore = function(data) {
	var scale = this.canvasScale;
	resetZoom();
	this.canvas2.loadFromJSON(data.json);
	this.canvasScale = scale;
	if(this.editable==false){
		this.idle = false;
		this.editable = false;
		this.canvas2.selection = false;
		this.canvas2.forEachObject(function(o) {
			o.selectable = false;
		});
		this.canvas2.isDrawingMode = false;
		this.canvas2.off('mouse:up');
		this.canvas2.off('mouse:down');
		this.canvas2.off('mouse:move');
	}
	if(this.canvasScale!=1)
	{
		disable();
		this.canvas2.deactivateAllWithDispatch();
		//this.disable();
		
		this.canvas2.setHeight(this.canvas2.getHeight() * this.canvasScale);
		this.canvas2.setWidth(this.canvas2.getWidth() * this.canvasScale);
		
		var objects = this.canvas2.getObjects();
		for (var i in objects) {
			var scaleX = objects[i].scaleX;
			var scaleY = objects[i].scaleY;
			var left = objects[i].left;
			var top = objects[i].top;
			
			var tempScaleX = scaleX * this.canvasScale;
			var tempScaleY = scaleY * this.canvasScale;
			var tempLeft = left * this.canvasScale;
			var tempTop = top * this.canvasScale;
			
			objects[i].scaleX = tempScaleX;
			objects[i].scaleY = tempScaleY;
			objects[i].left = tempLeft;
			objects[i].top = tempTop;
			
			objects[i].setCoords();
		}
	}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.initial = function(data) {
	console.log("initial!");
	console.log(data.json);
	
	this.canvas2.loadFromJSON(data.json);
	this.currentImage = data.json;
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};


Whiteboard.prototype.type = function(data) {
    // Set the color
    var type = data.type;
	console.log(type);
};

Whiteboard.prototype.remove = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			this.canvas2.remove(objArray[j]);
			break;
		}
	}
};

Whiteboard.prototype.colour = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			if(!((objArray[j].get('fill')=='transparent')||(objArray[j].get('fill')==null)))
				objArray[j].fill = data.fill; 
			if(objArray[j].stroke!='null')
				objArray[j].stroke = data.stroke; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.width = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].strokeWidth = data.strokeWidth; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.editText = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].text = data.text; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.editFontSize = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].fontSize = data.fontSize; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.editFontFamily = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].fontFamily = data.fontFamily; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.editFontWeight = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].fontWeight = data.fontWeight; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.editFontStyle = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){               //gets the object with id ='img1' 
			objArray[j].fontStyle = data.fontStyle; 
			objArray[j].setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	}
};

Whiteboard.prototype.up = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			this.canvas2.bringForward(objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.down = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			this.canvas2.sendBackwards(objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.rotate = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			if(this.canvasScale!=1)
				reset(this, objArray[j]);
			objArray[j].set('top',data.top);
			objArray[j].set('left',data.left);
			objArray[j].set('angle',data.angle);
			// objArray[j].set('width',data.width);
			// objArray[j].set('height',data.height);
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.groupRotate = function(data) {
	this.canvas2.discardActiveGroup();
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			console.log(objArray[j].angle);
		    if(this.canvasScale!=1)
				reset(this, objArray[j]);
			var objectOrigin = new fabric.Point(objArray[j].left, objArray[j].top);
			var new_loc = fabric.util.rotatePoint(objectOrigin, new fabric.Point(data.centerX, data.centerY), (data.angle-objArray[j].angle)* Math.PI / 180);
			objArray[j].top = new_loc.y;
			objArray[j].left = new_loc.x;
			objArray[j].set('angle',data.angle);
			objArray[j].setCoords();			
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.scale = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			if(this.canvasScale!=1)
				reset(this, objArray[j]);
			objArray[j].set('top',data.top);
			objArray[j].set('left',data.left);
			objArray[j].set('scaleX',data.scaleX);
			objArray[j].set('scaleY',data.scaleY);
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 	
};

Whiteboard.prototype.rectscale = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			if(this.canvasScale!=1)
				reset(this, objArray[j]);			
			objArray[j].set('top',data.top);
			objArray[j].set('left',data.left);
			objArray[j].set('width',data.width);
			objArray[j].set('height',data.height);
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 	
};


Whiteboard.prototype.linescale = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){ 
			var line = objArray[j];
			if(this.canvasScale!=1)
				reset(this, line);	
			this.canvas2.remove(line);
			line.set('x1',data.x1);
			line.set('y1',data.y1);
			line.set('x2',data.x2);
			line.set('y2',data.y2);
			line.set('top',data.top);
			line.set('left',data.left);
			line.set('width',data.width);
			line.set('height',data.height);
			line.setCoords();
			this.canvas2.add(line);
			if(this.canvasScale!=1)
				zoom(this, line);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.circlescale = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){  
			if(this.canvasScale!=1)
				reset(this, objArray[j]);			
			objArray[j].set('top',data.top);
			objArray[j].set('left',data.left);
			objArray[j].set('radius',data.radius);
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.move = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){
			if(this.canvasScale!=1)
				reset(this, objArray[j]);
			objArray[j].set('top',data.top);
			objArray[j].set('left',data.left);
			objArray[j].setCoords();
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.groupMove = function(data) {
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){
			if(this.canvasScale!=1)
				reset(this, objArray[j]);
			// objArray[j].set('top',data.top);
			// objArray[j].set('left',data.left);
			// objArray[j].setCoords();
			// console.log(data.rotate);
			// if(data.rotate!=0){
				// console.log('rotated move');
				// var objectOrigin = new fabric.Point(data.left, data.top);
				// var new_loc = fabric.util.rotatePoint(objectOrigin, new fabric.Point(data.centerX, data.centerY), ((data.rotate+data.angle)* Math.PI) / 180); //-objArray[j].angle
				// objArray[j].top = new_loc.y;
				// objArray[j].left = new_loc.x;
				// //objArray[j].set('angle',data.angle+data.rotate);
				// objArray[j].setCoords();
			// }
			// else{
				console.log('unrotated move');
				objArray[j].set('top',data.top);
				objArray[j].set('left',data.left);
				objArray[j].setCoords();
		//	}
			if(this.canvasScale!=1)
				zoom(this, objArray[j]);
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			//this.canvas2.deactivateAllWithDispatch();
			break;
		}
	} 
};

Whiteboard.prototype.create= function(data) {
	this.canvas2.isDrawingMode = false;
	if(data.type == 'rect'){
		var square = new fabric.Rect({ 
			width: data.width, 
			height: data.height, 
			left: data.left, 
			top: data.top, 
			fill: data.fill,
			opacity: 1,
			strokeWidth: data.strokeWidth, 
			stroke: data.stroke,
			originX: 'left',
			originY: 'top',
			id: data.id
		});
		console.log(square.id);
		
		this.canvas2.add(square); 
		if(this.canvasScale!=1){
			zoom(this, square);
			square.selectable = false;
		}
		this.canvas2.renderAll();
		this.canvas2.calcOffset(); 
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));	
		if(this.canvas2.selection==false)
			square.selectable=false;
	}
	else if(data.type == 'line'){
		console.log(data.x1, data.y1, data.x2, data.y2);
		var line = new fabric.Line([data.x1, data.y1, data.x2, data.y2],{ 
			strokeWidth: data.strokeWidth, 
			stroke: data.stroke,
			left: data.left,
			top: data.top,
			width: data.width,
			height: data.height,
			id: data.id,
			originX: 'left',
			originY: 'top'
		});
		console.log(line.id);
		this.canvas2.add(line); 
		if(this.canvasScale!=1){
			zoom(this, line);
			line.selectable = false;
		}
		this.canvas2.renderAll();
        this.canvas2.calcOffset(); 
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));
		if(this.canvas2.selection==false)
			line.selectable=false;
	}
	else if(data.type == 'circle'){
		var square = new fabric.Circle({ 
			radius: data.radius, 
			left: data.left, 
			top: data.top, 
			fill: data.fill,
			opacity: 1,
			strokeWidth: data.strokeWidth, 
			stroke: data.stroke,
			originX: 'left',
			originY: 'top',
			id: data.id
		});
		console.log(square.id);
		this.canvas2.add(square); 
		if(this.canvasScale!=1){
			zoom(this, square);
			square.selectable = false;
		}
		this.canvas2.renderAll();
		this.canvas2.calcOffset(); 
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));
		if(this.canvas2.selection==false)
			square.selectable=false;
	}
	else if(data.type == 'ellipse'){
		var square = new fabric.Ellipse({ 
			rx: data.rx,
			ry: data.ry,
			left: data.left, 
			top: data.top, 
			fill: data.fill,
			opacity: 1,
			strokeWidth: data.strokeWidth, 
			stroke: data.stroke,
			originX: 'left',
			originY: 'top',
			id: data.id
		});
		console.log(square.id);
		this.canvas2.add(square); 
		if(this.canvasScale!=1){
			zoom(this, square);
			square.selectable = false;
		}
		this.canvas2.renderAll();
		this.canvas2.calcOffset(); 
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));
		if(this.canvas2.selection==false)
			square.selectable=false;
	}
	else if(data.type == 'path'){
		var path = new fabric.Path('M 0 0 L 0 0', {
			stroke: data.stroke,
			strokeWidth: data.strokeWidth,
			strokeLineCap: "round",
			strokeLneJoin: "round",
			fill: null,
			id: data.id
		});
		path.set({ left: data.left, top: data.top, width: data.width, height: data.height});
		
		//console.log(data.path);
		npath = data.path;
		path.set('path', npath);
	
		this.canvas2.add(path);
		if(this.canvasScale!=1){
			zoom(this, path);
			path.selectable = false;
		}
		this.canvas2.renderAll();
		this.canvas2.calcOffset(); 
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));
		if(this.canvas2.selection==false)
			path.selectable=false;
	}
	else if(data.type == 'text'){
		var text = new fabric.Text(data.text, {
            left: data.left,
            top: data.top,
            textAlign: "left",
			fontFamily: data.fontFamily,
            fontSize: data.fontSize,
            fontWeight: data.fontWeight,
			fontStyle: data.fontStyle,
			fill: data.fill,
			id: data.id
        });
		this.canvas2.add(text); 
		if(this.canvasScale!=1){
			zoom(this, text);
			text.selectable = false;
		}
		this.canvas2.renderAll();
		this.canvas2.calcOffset(); 
		if(this.canvas2.selection==false)
			text.selectable=false;
	}
	else if(data.type == 'image'){
		//console.log(data);
		var imgObj = new Image();
		
		var image = new fabric.Image(imgObj);
		image.set({
			left: data.x,
			top: data.y,
			width: data.width,
			height: data.height,
			id: data.id
		});
		
		this.canvas2.add(image);
		this.canvas2.sendToBack(image);
		// var json = JSON.stringify(this.canvas2.toJSON(['id']));
		// this.socket.send(JSON.stringify({
			// msg: 'save',
			// data: {
				// json: json
			// }
		// }));
		//console.log(image);
	
		var that = this;
		//imgObj.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sMEQ4oKYwJgHsAAAMoSURBVFjD7ZZRaFtVGMd/5+a0ubkmS7tlXbuYblpa1zGyqV1pgy9OkKFjyvDFF/smccoQxrQMQQoTdPqisBFBQcUhIvomCEWGD40owrayTtdsa1NY0jRL0iWkub25uceXFoXV2qzL9tI/fHC53Pv9f9855/s4sKENPWCJlV4qpdadOBrR3QJGNEHuzJj5IYAQd9ppjagqGtG9An7ZpIvjQvDyat9qDTDfAvy+79HAPr9Hq9oO39w3gGhEDwEX9u/p7n7qyd3uVMkFcO6+AEQjegBEPLy7J3jwiQ45dvUWtm2Nx+JmquEA0YhuAOcf6epuPxI2tPHkbf6anisDZ//vX+0emEvgx0DHju5De7zycmKGKzmJWco7wPcNBwC+9Afa+58Nb3WXM5NMmtuYz6ZNcD6Kxc1yQwGiEf0D76bNLwz2hozt9nUuzLooOh7y2VnHUXy8lhzaOszfcHu8r+/q6Xpo0J/kt6ky07UgqnhzUeCcjcXN2w2bhKdOHnsLVX2/GUsccI2RzaT5Nb+V7QE/lycmsrZDVyxulu4wW2ES1g0wMjKiGV795q7Hetttu6quJf4U1qXv2Oz3MXllfKGyaB2Kxc3zK1a7AoCsd+kNo/k5XXd7Djz9DKVSSSgHrqmXyF/61qrZ1tf/ZX7PzoCQrpP9fQP+pqYmpqamWFio0NYeVFrPQceq8Wa9+eoCOH36VC9K7Q2H95JOp8lkMrikpnK5WwXN7Xs8Fjcr9QLUtwWy6Xj//oFmTdNIJBIU5vNOLpctKKc6+Pbwu4m76aY1AUgpfcFg8JOdO3e8cvGPi1pyeoaKueAUS/N55VQHTpx453rDLiRCiC1tbW0/DQ0N9fn9fkZHR0kmkxx+8flCx7aH+4aHh2+s2azeLhBCSOAHKWVfKBSitbUVj8eDlJKvvjj3WaFQuLHeOb7qCgghzgBHfT4fnZ2dtLS0UC6XSaVSzM3NHQV+BhzAXooqYC3FolLKvutBJIR4Ffj0n/43MAwDy7IoFotp4DXAXCUqQFkpVasbADgGvLfMs1TlLDADTACfA4tAbanq5cqXn6v/Nl4NYEMbeuD6G2BFQviVGcVVAAAAAElFTkSuQmCC";
		var imgObj = new Image();
		imgObj.src = data.src;
		
		imgObj.onload = function () {
			// start fabricJS stuff
			//console.log(imgObj.width,imgObj.height,that.canvas.width, that.canvas.height);	
			//console.log(image);
			
			oWidth = image.width;
			oHeight = image.height;
			oTop = image.top;
			oLeft = image.left;
			oAngle = image.angle;
			console.log(oWidth,oHeight,oTop, oLeft,oAngle);
			
			image.setElement(imgObj);
			image.set({
				left: oLeft,
				top: oTop,
				width: oWidth,
				height: oHeight,
				angle: oAngle
			});

			image.setCoords();
			if(that.canvasScale!=1){
				zoom(that, image);
				image.selectable = false;
			}
			
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 
			// var json = JSON.stringify(that.canvas2.toJSON(['id']));
			// that.socket.send(JSON.stringify({
				// msg: 'save',
				// data: {
					// json: json
				// }
			// }));
			if(this.canvas2.selection==false)
				image.selectable=false;
		}
	}
};

Whiteboard.prototype.finish= function(data) {
	console.log('finished');
	var objArray = this.canvas2.getObjects();
	for (var j = 0 ; j < objArray.length; j++) {
		if(objArray[j].id ==data.id){     
			var square = objArray[j];
			this.canvas2.remove(objArray[j]);
			var center = square.getCenterPoint();
			square.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			this.canvas2.add(square);
			square.setCoords();
			if(this.canvasScale!=1)
				objArray[j].selectable = false;
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			this.canvas2.deactivateAllWithDispatch();
			// var json = JSON.stringify(this.canvas2.toJSON(['id']));
			// this.socket.send(JSON.stringify({
				// msg: 'save',
				// data: {
					// json: json
				// }
			// }));
			// this.removedImages = [];
			// this.savedImages.push(this.currentImage);
			// this.currentImage = json;
			if(this.canvas2.selection==false)
				square.selectable=false;
		}
	}
};

Whiteboard.prototype.bgColor = function(data) {
	this.canvas2.backgroundColor='rgb(' + data.color.r + "," + data.color.g + "," + data.color.b +')';
	this.canvas2.renderAll();
    this.canvas2.calcOffset(); 	
	var json = JSON.stringify(this.canvas2.toJSON(['id']));
	this.socket.send(JSON.stringify({
		msg: 'save',
		data: {
			json: json
		}
	}));
};

Whiteboard.prototype.draw = function() {
	console.log("draw");
	var that = this;
	this.canvas2.isDrawingMode = true;
}

Whiteboard.prototype.text = function() {
	console.log("text");
	var that = this;
	this.canvas2.isDrawingMode = false;
	
	
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	// this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
    //this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		x = mouse.x;
		y = mouse.y;
		
		var text = new fabric.Text(that.context, {
            left: x,
            top: y,
            textAlign: "left",
			fontFamily: that.fontFace,
            fontSize: that.fontSize,
            fontWeight: that.fontWeight,
			fontStyle: that.fontStyle,
			fill: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
			originX: 'left',
			originY: 'top',
			id: that.auth+(that.i++)
        });
		
		var center = text.getCenterPoint();
		text.set({
			originX: 'center',
			originY: 'center',
			left: center.x,
			top: center.y
		});
		
		text.selectable = false;

        that.canvas2.add(text);
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 
		
		that.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				text: that.context,
				type: 'text',
				id: text.id,
				top: text.top,
				left: text.left,
				textAlign: "left",
				fontFamily: text.fontFamily,
				fontSize: text.fontSize,
				fontWeight: text.fontWeight,
				fontStyle: text.fontStyle,
				fill: text.fill
			}
		}));

		that.socket.send(JSON.stringify({
			msg: 'unselected',
			data: {
				id: text.id,
				user: that.username
			}
		}));
		that.selectList[text.id]=[true, that.username];
		
		var json = JSON.stringify(that.canvas2.toJSON(['id']));
		that.socket.send(JSON.stringify({
			msg: 'save',
			data: {
				json: json
			}
		}));
		that.removedImages = [];
		that.savedImages.push(that.currentImage);
		that.currentImage = json;
		// canvas2.add(square); 
		// canvas2.renderAll();
		// canvas2.calcOffset(); 

	}

}

Whiteboard.prototype.latex = function() {
	console.log("latex");
	var that = this;
	this.canvas2.isDrawingMode = false;

	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	// this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
    //this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		x = mouse.x;
		y = mouse.y;
		
		var imgObj = new Image();
		//imgObj.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sMEQ4oKYwJgHsAAAMoSURBVFjD7ZZRaFtVGMd/5+a0ubkmS7tlXbuYblpa1zGyqV1pgy9OkKFjyvDFF/smccoQxrQMQQoTdPqisBFBQcUhIvomCEWGD40owrayTtdsa1NY0jRL0iWkub25uceXFoXV2qzL9tI/fHC53Pv9f9855/s4sKENPWCJlV4qpdadOBrR3QJGNEHuzJj5IYAQd9ppjagqGtG9An7ZpIvjQvDyat9qDTDfAvy+79HAPr9Hq9oO39w3gGhEDwEX9u/p7n7qyd3uVMkFcO6+AEQjegBEPLy7J3jwiQ45dvUWtm2Nx+JmquEA0YhuAOcf6epuPxI2tPHkbf6anisDZ//vX+0emEvgx0DHju5De7zycmKGKzmJWco7wPcNBwC+9Afa+58Nb3WXM5NMmtuYz6ZNcD6Kxc1yQwGiEf0D76bNLwz2hozt9nUuzLooOh7y2VnHUXy8lhzaOszfcHu8r+/q6Xpo0J/kt6ky07UgqnhzUeCcjcXN2w2bhKdOHnsLVX2/GUsccI2RzaT5Nb+V7QE/lycmsrZDVyxulu4wW2ES1g0wMjKiGV795q7Hetttu6quJf4U1qXv2Oz3MXllfKGyaB2Kxc3zK1a7AoCsd+kNo/k5XXd7Djz9DKVSSSgHrqmXyF/61qrZ1tf/ZX7PzoCQrpP9fQP+pqYmpqamWFio0NYeVFrPQceq8Wa9+eoCOH36VC9K7Q2H95JOp8lkMrikpnK5WwXN7Xs8Fjcr9QLUtwWy6Xj//oFmTdNIJBIU5vNOLpctKKc6+Pbwu4m76aY1AUgpfcFg8JOdO3e8cvGPi1pyeoaKueAUS/N55VQHTpx453rDLiRCiC1tbW0/DQ0N9fn9fkZHR0kmkxx+8flCx7aH+4aHh2+s2azeLhBCSOAHKWVfKBSitbUVj8eDlJKvvjj3WaFQuLHeOb7qCgghzgBHfT4fnZ2dtLS0UC6XSaVSzM3NHQV+BhzAXooqYC3FolLKvutBJIR4Ffj0n/43MAwDy7IoFotp4DXAXCUqQFkpVasbADgGvLfMs1TlLDADTACfA4tAbanq5cqXn6v/Nl4NYEMbeuD6G2BFQviVGcVVAAAAAElFTkSuQmCC";
		imgObj.src = that.latexImage;
		imgObj.onload = function () {
			// start fabricJS stuff
			console.log(imgObj.width,imgObj.height,that.canvas.width, that.canvas.height);
			
			var image = new fabric.Image(imgObj);
			image.set({
				left: x,
				top: y,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
				
			if(imgObj.width>that.canvas.width)
				if(imgObj.width/(that.canvas.width-x) > imgObj.height/(that.canvas.height-y))
					image.set({
						width: that.canvas.width-x,
						height: (that.canvas.width-x)*(imgObj.height/imgObj.width)	
					});
				else
					image.set({
						width: (that.canvas.height-y)*(imgObj.width/imgObj.height),
						height: that.canvas.height-y
					});	
			else if(imgObj.height>that.canvas.height)
				if(imgObj.width/(that.canvas.width-x) < imgObj.height/(that.canvas.height-y))
					image.set({
						width: (that.canvas.height-y)*(imgObj.width/imgObj.height),
						height: that.canvas.height-y
					});	
				else
					image.set({
						width: that.canvas.width-x,
						height: (that.canvas.width-x)*(imgObj.height/imgObj.width)
					});		
			
			var center = image.getCenterPoint();
			image.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			
			image.selectable = false;
			
			that.canvas2.add(image);
			//that.canvas2.sendToBack(image);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 
			// end fabricJS stuff
			
			that.socket.send(JSON.stringify({
				msg: 'create',
				data: {
					type: 'image',
					id: image.id,
					x: image.left,
					y: image.top,
					src: that.latexImage,
					width: image.width,
					height: image.height
				}
			}));
			that.socket.send(JSON.stringify({
				msg: 'unselected',
				data: {
					id: image.id,
					user: that.username
				}
			}));
			that.selectList[image.id]=[true, that.username];
			
			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;
		}
	}
}

Whiteboard.prototype.image = function() {
	console.log("image");
	var that = this;
	this.canvas2.isDrawingMode = false;

	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	// this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
    //this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		x = mouse.x;
		y = mouse.y;
		
		var imgObj = new Image();
		//imgObj.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sMEQ4oKYwJgHsAAAMoSURBVFjD7ZZRaFtVGMd/5+a0ubkmS7tlXbuYblpa1zGyqV1pgy9OkKFjyvDFF/smccoQxrQMQQoTdPqisBFBQcUhIvomCEWGD40owrayTtdsa1NY0jRL0iWkub25uceXFoXV2qzL9tI/fHC53Pv9f9855/s4sKENPWCJlV4qpdadOBrR3QJGNEHuzJj5IYAQd9ppjagqGtG9An7ZpIvjQvDyat9qDTDfAvy+79HAPr9Hq9oO39w3gGhEDwEX9u/p7n7qyd3uVMkFcO6+AEQjegBEPLy7J3jwiQ45dvUWtm2Nx+JmquEA0YhuAOcf6epuPxI2tPHkbf6anisDZ//vX+0emEvgx0DHju5De7zycmKGKzmJWco7wPcNBwC+9Afa+58Nb3WXM5NMmtuYz6ZNcD6Kxc1yQwGiEf0D76bNLwz2hozt9nUuzLooOh7y2VnHUXy8lhzaOszfcHu8r+/q6Xpo0J/kt6ky07UgqnhzUeCcjcXN2w2bhKdOHnsLVX2/GUsccI2RzaT5Nb+V7QE/lycmsrZDVyxulu4wW2ES1g0wMjKiGV795q7Hetttu6quJf4U1qXv2Oz3MXllfKGyaB2Kxc3zK1a7AoCsd+kNo/k5XXd7Djz9DKVSSSgHrqmXyF/61qrZ1tf/ZX7PzoCQrpP9fQP+pqYmpqamWFio0NYeVFrPQceq8Wa9+eoCOH36VC9K7Q2H95JOp8lkMrikpnK5WwXN7Xs8Fjcr9QLUtwWy6Xj//oFmTdNIJBIU5vNOLpctKKc6+Pbwu4m76aY1AUgpfcFg8JOdO3e8cvGPi1pyeoaKueAUS/N55VQHTpx453rDLiRCiC1tbW0/DQ0N9fn9fkZHR0kmkxx+8flCx7aH+4aHh2+s2azeLhBCSOAHKWVfKBSitbUVj8eDlJKvvjj3WaFQuLHeOb7qCgghzgBHfT4fnZ2dtLS0UC6XSaVSzM3NHQV+BhzAXooqYC3FolLKvutBJIR4Ffj0n/43MAwDy7IoFotp4DXAXCUqQFkpVasbADgGvLfMs1TlLDADTACfA4tAbanq5cqXn6v/Nl4NYEMbeuD6G2BFQviVGcVVAAAAAElFTkSuQmCC";
		imgObj.src = that.imageBase64;
		imgObj.onload = function () {
			// start fabricJS stuff
			console.log(imgObj.width,imgObj.height,that.canvas.width, that.canvas.height);
			
			var image = new fabric.Image(imgObj);
			image.set({
				left: x,
				top: y,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
				
			if(imgObj.width>that.canvas.width)
				if(imgObj.width/(that.canvas.width-x) > imgObj.height/(that.canvas.height-y))
					image.set({
						width: that.canvas.width-x,
						height: (that.canvas.width-x)*(imgObj.height/imgObj.width)	
					});
				else
					image.set({
						width: (that.canvas.height-y)*(imgObj.width/imgObj.height),
						height: that.canvas.height-y
					});	
			else if(imgObj.height>that.canvas.height)
				if(imgObj.width/(that.canvas.width-x) < imgObj.height/(that.canvas.height-y))
					image.set({
						width: (that.canvas.height-y)*(imgObj.width/imgObj.height),
						height: that.canvas.height-y
					});	
				else
					image.set({
						width: that.canvas.width-x,
						height: (that.canvas.width-x)*(imgObj.height/imgObj.width)
					});		
			
			var center = image.getCenterPoint();
			image.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			
			image.selectable = false;
			
			that.canvas2.add(image);
			that.canvas2.sendToBack(image);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 
			// end fabricJS stuff
			
			that.socket.send(JSON.stringify({
				msg: 'create',
				data: {
					type: 'image',
					id: image.id,
					x: image.left,
					y: image.top,
					src: that.imageBase64,
					width: image.width,
					height: image.height
				}
			}));
			
			that.socket.send(JSON.stringify({
				msg: 'unselected',
				data: {
					id: image.id,
					user: that.username
				}
			}));
			that.selectList[image.id]=[true, that.username];
			
			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;
		}
	}

}

Whiteboard.prototype.rect = function() {
	console.log("rect");
	var that = this;
	this.canvas2.isDrawingMode = false;

	//this.canvas2.on('object:selected', this.onObjectSelected.bind(this));
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
	this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var started = false;
	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		started = true;
		x = mouse.x;
		y = mouse.y;

		if(that.style==1)
			var square = new fabric.Rect({ 
				width: 2, 
				height: 2, 
				left: x, 
				top: y, 
				fill: 'transparent',
				opacity: 1,
				strokeWidth: that.width, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
		else
			var square = new fabric.Rect({ 
				width: 2, 
				height: 2, 
				left: x, 
				top: y, 
				fill: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				opacity: 1,
				strokeWidth: 0, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});			

		console.log(square.id);
		
		that.canvas2.add(square); 
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 

		that.canvas2.setActiveObject(square); 
		
		that.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				type: 'rect',
				id: square.id,
				top: square.top,
				left: square.left,
				width: square.getWidth(),
				height: square.getHeight(),
				fill: square.fill,
				strokeWidth: square.strokeWidth, 
				stroke: square.stroke,
			}
		}));

		// canvas2.add(square); 
		// canvas2.renderAll();
		// canvas2.calcOffset(); 

	}

	/* Mousemove */
	function mousemove(e) {
		if(!started) {
			return false;
		}

		var mouse = that.canvas2.getPointer(e.e);
		
		var w = Math.abs(mouse.x - x),
		h = Math.abs(mouse.y - y);
		var newX = Math.min(x,  mouse.x);
		var newY = Math.min(y,  mouse.y);
		
		// console.log(x,w,h);

		if (!w || !h) {
			return false;
		}

		var square = that.canvas2.getActiveObject(); 
		square.set('left', newX).set('top',newY).set('width', w).set('height', h);
		
		that.canvas2.renderAll(); 
        that.canvas2.calcOffset();
		
		that.socket.send(JSON.stringify({
			msg: 'rectscale',
			data: {
				id: square.id,
				top: square.top,
				left: square.left,
				width: square.getWidth(),
				height: square.getHeight()
			}
		}));
	}

	/* Mouseup */
	function mouseup(e) {
		if(started) {
			started = false;
			var square = that.canvas2.getActiveObject();
			that.canvas2.remove(square);
			var center = square.getCenterPoint();
			square.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			
			square.selectable = false;
			that.canvas2.add(square);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 			
			that.socket.send(JSON.stringify({
				msg: 'finish',
				data: {
					id: square.id
				}
			}));

			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;			
		}
	} 
}

Whiteboard.prototype.square = function() {
	console.log("square");
	var that = this;
	this.canvas2.isDrawingMode = false;

	
	
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
	this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var started = false;
	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		started = true;
		x = mouse.x;
		y = mouse.y;

		if(that.style==1)
			var square = new fabric.Rect({ 
				width: 2, 
				height: 2, 
				left: x, 
				top: y, 
				fill: 'transparent',
				opacity: 1,
				strokeWidth: that.width, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
		else
			var square = new fabric.Rect({ 
				width: 2, 
				height: 2, 
				left: x, 
				top: y, 
				fill: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				opacity: 1,
				strokeWidth: 0, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});			

		console.log(square.id);
		that.canvas2.add(square); 
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 

		that.canvas2.setActiveObject(square); 
		
		that.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				type: 'rect',
				id: square.id,
				top: square.top,
				left: square.left,
				width: square.getWidth(),
				height: square.getHeight(),
				fill: square.fill,
				strokeWidth: square.strokeWidth, 
				stroke: square.stroke,
			}
		}));

	}

	/* Mousemove */
	function mousemove(e) {
		if(!started) {
			return false;
		}

		var mouse = that.canvas2.getPointer(e.e);
		
		var w = Math.abs(mouse.x - x),
		h = Math.abs(mouse.y - y);
		var newX = Math.min(x,  mouse.x);
		var newY = Math.min(y,  mouse.y);
		
		// console.log(x,w,h);

		if (!w || !h) {
			return false;
		}

		var square = that.canvas2.getActiveObject(); 
		//square.set('left', newX).set('top',newY).set('width', w).set('height', h);

		var l = Math.min(w, h);
		
		if(w < h && mouse.y < y) //(original point)
			square.set('left', newX).set('top',y - l).set('width', l).set('height', l);
		else if(w > h && mouse.x < x)
			square.set('left', x - l).set('top',newY).set('width', l).set('height', l);
		else
			square.set('left', newX).set('top',newY).set('width', l).set('height', l);
		
		that.canvas2.renderAll(); 
        that.canvas2.calcOffset();
		
		that.socket.send(JSON.stringify({
			msg: 'rectscale',
			data: {
				id: square.id,
				top: square.top,
				left: square.left,
				width: square.getWidth(),
				height: square.getHeight()
			}
		}));
	}

	/* Mouseup */
	function mouseup(e) {
		if(started) {
			started = false;
			var square = that.canvas2.getActiveObject();
			that.canvas2.remove(square);
			var center = square.getCenterPoint();
			square.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			
			square.selectable = false;
			that.canvas2.add(square);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 			
			that.socket.send(JSON.stringify({
				msg: 'finish',
				data: {
					id: square.id
				}
			}));	
			
			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;	
		}
	} 
}

Whiteboard.prototype.circle = function() {
	console.log("circle");
	var that = this;
	this.canvas2.isDrawingMode = false;
	
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
	this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var started = false;
	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		started = true;
		x = mouse.x;
		y = mouse.y;

		// new fabric.Circle({
    // left: mouse_pos.x,
    // top: mouse_pos.y,
    // radius: 30,
    // fill: 'white',
    // stroke: 'black',
    // strokeWidth: 3,
	// id: index++
  // })
		
		
		if(that.style==1)
			var circle = new fabric.Circle({ 
				radius: 5, 
				left: x, 
				top: y, 
				fill: 'transparent',
				opacity: 1,
				strokeWidth: that.width, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
		else
			var circle = new fabric.Circle({ 
				radius: 5, 
				left: x, 
				top: y, 
				fill: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				opacity: 1,
				strokeWidth: 0, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});			

		console.log(circle.id);
		that.canvas2.add(circle); 
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 

		that.canvas2.setActiveObject(circle); 
		
		that.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				type: 'circle',
				id: circle.id,
				top: circle.top,
				left: circle.left,
				radius: circle.radius,
				fill: circle.fill,
				strokeWidth: circle.strokeWidth, 
				stroke: circle.stroke,
			}
		}));

	}

	/* Mousemove */
	function mousemove(e) {
		if(!started) {
			return false;
		}

		var mouse = that.canvas2.getPointer(e.e);
		
		var w = Math.abs(mouse.x - x),
		h = Math.abs(mouse.y - y);
		var newX = Math.min(x,  mouse.x);
		var newY = Math.min(y,  mouse.y);
		
		// console.log(x,w,h);

		if (!w || !h) {
			return false;
		}

		var circle = that.canvas2.getActiveObject(); 
		//circle.set('left', newX).set('top',newY).set('width', w).set('height', h);

		var l = Math.min(w, h);
		
		if(w < h && mouse.y < y) //(original point)
			circle.set('left', newX).set('top',y - l).set('radius', l/2);
		else if(w > h && mouse.x < x)
			circle.set('left', x - l).set('top',newY).set('radius', l/2);
		else
			circle.set('left', newX).set('top',newY).set('radius', l/2);
		
		that.canvas2.renderAll(); 
        that.canvas2.calcOffset();
		
		that.socket.send(JSON.stringify({
			msg: 'circlescale',
			data: {
				id: circle.id,
				top: circle.top,
				left: circle.left,
				radius: circle.radius
			}
		}));
	}

	/* Mouseup */
	function mouseup(e) {
		if(started) {
			started = false;
			var circle = that.canvas2.getActiveObject();
			that.canvas2.remove(circle);
			var center = circle.getCenterPoint();
			circle.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			
			circle.selectable = false;
			that.canvas2.add(circle);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 			
			that.socket.send(JSON.stringify({
				msg: 'finish',
				data: {
					id: circle.id
				}
			}));	
			
			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;	
		}
	} 
}

Whiteboard.prototype.ellipse = function() {
	console.log("ellipse");
	var that = this;
	this.canvas2.isDrawingMode = false;
	
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
	this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var started = false;
	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		started = true;
		x = mouse.x;
		y = mouse.y;

		// new fabric.Ellipse({
    // left: mouse_pos.x,
    // top: mouse_pos.y,
    // radius: 30,
    // fill: 'white',
    // stroke: 'black',
    // strokeWidth: 3,
	// id: index++
  // })
		
		
		if(that.style==1)
			var circle = new fabric.Ellipse({ 
				rx: 25, 
				ry: 25, 
				left: x, 
				top: y, 
				fill: 'transparent',
				opacity: 1,
				strokeWidth: that.width, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});
		else
			var circle = new fabric.Ellipse({ 
				rx: 25, 
				ry: 25, 
				left: x, 
				top: y, 
				fill: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				opacity: 1,
				strokeWidth: 0, 
				stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
				transparentCorners: true,
				originX: 'left',
				originY: 'top',
				id: that.auth+(that.i++)
			});			

		console.log(circle.id);
		that.canvas2.add(circle); 
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 

		that.canvas2.setActiveObject(circle); 
		
		that.socket.send(JSON.stringify({
			msg: 'create',
			data: {
				type: 'ellipse',
				id: circle.id,
				top: circle.top,
				left: circle.left,
				rx: circle.rx,
				ry: circle.ry,
				fill: circle.fill,
				strokeWidth: circle.strokeWidth, 
				stroke: circle.stroke,
			}
		}));

	}

	/* Mousemove */
	function mousemove(e) {
		if(!started) {
			return false;
		}

		var mouse = that.canvas2.getPointer(e.e);
		
		var w = Math.abs(mouse.x - x),
		h = Math.abs(mouse.y - y);
		var newX = Math.min(x,  mouse.x);
		var newY = Math.min(y,  mouse.y);
		
		// console.log(x,w,h);

		if (!w || !h) {
			return false;
		}

		var circle = that.canvas2.getActiveObject(); 
		circle.set('left', newX).set('top',newY).set('scaleX', (w/2)/25).set('scaleY', (h/2)/25);
		
		// if(w < h && mouse.y < y) //(original point)
			// circle.set('left', newX).set('top',y - l).set('radius', l/2);
		// else if(w > h && mouse.x < x)
			// circle.set('left', x - l).set('top',newY).set('radius', l/2);
		// else
			// circle.set('left', newX).set('top',newY).set('radius', l/2);


	
		that.canvas2.renderAll(); 
        that.canvas2.calcOffset();
		
		that.socket.send(JSON.stringify({
			msg: 'scale',
			data: {
				type: 'ellipse',
				id: circle.id,
				top: circle.top,
				left: circle.left,
				scaleX: circle.scaleX,
				scaleY: circle.scaleY
			}
		}));
	}

	/* Mouseup */
	function mouseup(e) {
		if(started) {
			started = false;
			var circle = that.canvas2.getActiveObject();
			that.canvas2.remove(circle);
			var center = circle.getCenterPoint();
			circle.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			circle.setCoords();
			
			circle.selectable = false;
			that.canvas2.add(circle);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 			
			that.socket.send(JSON.stringify({
				msg: 'finish',
				data: {
					id: circle.id
				}
			}));

			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;				
		}
	} 
}


Whiteboard.prototype.line = function() {
	console.log("line");
	var that = this;
	this.canvas2.isDrawingMode = false;

	//this.canvas2.on('object:selected', this.onObjectSelected.bind(this));
	this.canvas2.observe('mouse:down', function(e) { mousedown(e); });
	this.canvas2.observe('mouse:move', function(e) { mousemove(e); });
	this.canvas2.observe('mouse:up', function(e) { mouseup(e); });

	var started = false;
	var x = 0;
	var y = 0;

	/* Mousedown */
	function mousedown(e) {
		var mouse = that.canvas2.getPointer(e.e);
		started = true;
		x = mouse.x;
		y = mouse.y;
		
		var line = new fabric.Line([x, y, x, y],{ 
			strokeWidth: that.width, 
			stroke: 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')',
			originX: 'left',
			originY: 'top',
			id: that.auth+(that.i++)
		});

		console.log(line.id);
		that.canvas2.add(line); 
		that.canvas2.renderAll();
        that.canvas2.calcOffset(); 

		that.canvas2.setActiveObject(line); 
		
		// that.socket.send(JSON.stringify({
			// msg: 'create',
			// data: {
				// type: 'line',
				// id: line.id,
				// x1: x,
				// y1: y,
				// x2: x,
				// y2: y,
				// strokeWidth: line.strokeWidth, 
				// stroke: line.stroke,
			// }
		// }));
		
			that.socket.send(JSON.stringify({
				msg: 'create',
				data: {
					type: 'line',
					id: line.id,
					left: line.left,
					top:line.top,
					width: line.width,
					height:line.height,
					x1: line.x1,
					y1: line.y1,
					x2: line.x2,
					y2: line.y2,
					strokeWidth: line.strokeWidth, 
					stroke: line.stroke,
				}
			}));

		// canvas2.add(line); 
		// canvas2.renderAll();
		// canvas2.calcOffset(); 

	}

	/* Mousemove */
	function mousemove(e) {
		if(!started) {
			return false;
		}

		var mouse = that.canvas2.getPointer(e.e);
		
		var w = Math.abs(mouse.x - x),
		h = Math.abs(mouse.y - y);
		var newX = Math.min(x,  mouse.x);
		var newY = Math.min(y,  mouse.y);
		
		// console.log(x,w,h);

		if (!w || !h) {
			return false;
		}

		var line = that.canvas2.getActiveObject(); 

		if(mouse.x > x && mouse.y < y) //(original point)
			line.set('x1', x).set('y1',y).set('x2', newX + w).set('y2', newY);
		else if(mouse.x < x && mouse.y > y)
			line.set('x1', x).set('y1',y).set('x2', newX).set('y2', newY + h);
		else
			line.set('x1', newX).set('y1',newY).set('x2', newX + w).set('y2', newY + h);

		
		that.canvas2.renderAll(); 
        that.canvas2.calcOffset();
		
		that.socket.send(JSON.stringify({
			msg: 'linescale',
			data: {
				id: line.id,
				x1: line.x1,
				y1: line.y1,
				x2: line.x2,
				y2: line.y2,
				left: line.left,
				top:line.top,
				width: line.width,
				height:line.height
			}
		}));
		console.log(line.get('x1'),line.get('y1'),line.get('x2'),line.get('y2'));
	}

	/* Mouseup */
	function mouseup(e) {
		if(started) {
			started = false;
			var line = that.canvas2.getActiveObject();
			that.canvas2.remove(line);
			var center = line.getCenterPoint();
			line.set({
				originX: 'center',
				originY: 'center',
				left: center.x,
				top: center.y
			});
			line.selectable = false;
			that.canvas2.add(line);
			that.canvas2.renderAll();
			that.canvas2.calcOffset(); 	
			//console.log(line);
			that.socket.send(JSON.stringify({
				msg: 'finish',
				data: {
					id: line.id
				}
			}));	

			var json = JSON.stringify(that.canvas2.toJSON(['id']));
			that.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			that.removedImages = [];
			that.savedImages.push(that.currentImage);
			that.currentImage = json;	
		}
	} 
}

Whiteboard.prototype.connect = function() {
    var url = "ws://" + document.URL.substr(7).split('/')[0];
    
    var wsCtor = window['MozWebSocket'] ? MozWebSocket : WebSocket;
    this.socket = new wsCtor(url, 'whiteboard');

    this.socket.onmessage = this.handleWebsocketMessage.bind(this);
    this.socket.onclose = this.handleWebsocketClose.bind(this);

    this.addCanvasEventListeners();
	//this.socket.send(JSON.stringify({ msg: 'enterRoom' }));
	// this.socket.emit(JSON.stringify({
		// msg: 'adduser',
		// data: this.username
	// }));
};

Whiteboard.prototype.handleWebsocketMessage = function(message) {
    try {
        var command = JSON.parse(message.data);
    }
    catch(e) { /* do nothing */ }
    
    if (command) {
        this.dispatchCommand(command);
    }
};

Whiteboard.prototype.handleWebsocketClose = function() {
    alert("WebSocket Connection Closed.");
};

Whiteboard.prototype.dispatchCommand = function(command) {
    // Do we have a handler function for this command?
    var handler = this.messageHandlers[command.msg];
    if (typeof(handler) === 'function') {
        // If so, call it and pass the parameter data
        handler.call(this, command.data);
		//this.savedImages.push(this.canvas.toDataURL("image/png"));
    }
};

Whiteboard.prototype.initCommands = function(commandList) {
    /* Upon connection, the contents of the whiteboard
       are drawn by replaying all commands since the
       last time it was cleared */
    commandList.forEach(function(command) {
		//console.log(command);
        this.dispatchCommand(command);
    }.bind(this));
};

Whiteboard.prototype.sendClear = function() {
    this.socket.send(JSON.stringify({ msg: 'clear' }));
	console.log("Clear!");
};

Whiteboard.prototype.setColor = function(r,g,b) {
    this.color = {
        r: r,
        g: g,
        b: b
    };
	this.canvas2.freeDrawingBrush.color = 'rgb(' + this.color.r + "," + this.color.g + "," + this.color.b +')'; 
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	if (activeObject) {
		if(activeObject.type!=('image')){
			if(!((activeObject.get('fill')=='transparent')||(activeObject.get('fill')==null)))
				activeObject.fill = 'rgb(' + this.color.r + "," + this.color.g + "," + this.color.b +')'; 
			if(activeObject.stroke!='null')
				activeObject.stroke = 'rgb(' + this.color.r + "," + this.color.g + "," + this.color.b +')'; 
			this.socket.send(JSON.stringify({
				msg: 'colour',
				data: {
					id: activeObject.id,
					fill: activeObject.fill,
					stroke: activeObject.stroke
				}
			}));	
		}
		var json = JSON.stringify(this.canvas2.toJSON(['id']));
		this.socket.send(JSON.stringify({
			msg: 'save',
			data: {
				json: json
			}
		}));
	}
	else if (activeGroup) {
		//this.canvas2.discardActiveGroup();
		//console.log(activeGroup.id);
		this.socket.send(JSON.stringify({
			msg: 'groupColour',
			data: {
				id: activeGroup.id,
				color: this.color
			}
		}));
		
		var that = this;
		var objectsInGroup = activeGroup.getObjects();
		objectsInGroup.forEach(function(object) {
			if(object.type!=('image')){
				if(!((object.get('fill')=='transparent')||(object.get('fill')==null)))
					object.fill = 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')'; 
				if(object.stroke!='null')
					object.stroke = 'rgb(' + that.color.r + "," + that.color.g + "," + that.color.b +')'; 
			}
		});
	}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.setWidth = function(width) {
    this.width = width;
	this.canvas2.freeDrawingBrush.width = this.width;
	var activeObject = this.canvas2.getActiveObject(),
	activeGroup = this.canvas2.getActiveGroup();
	if (activeObject) {
		if(activeObject.type!=('image')&&activeObject.type!=('text')){
			if(activeObject.strokeWidth!=0){
				activeObject.strokeWidth = this.width; 
				activeObject.setCoords();
				this.socket.send(JSON.stringify({
					msg: 'width',
					data: {
						id: activeObject.id,
						strokeWidth: activeObject.strokeWidth
					}
				}));	
			}
			var json = JSON.stringify(this.canvas2.toJSON(['id']));
			this.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
		}
	}
	else if (activeGroup) {
		this.socket.send(JSON.stringify({
			msg: 'groupWidth',
			data: {
				id: activeGroup.id,
				strokeWidth: this.width
			}
		}));
		var objectsInGroup = activeGroup.getObjects();
		var that = this;
		objectsInGroup.forEach(function(object) {
			if(object.type!=('image')&&object.type!=('text')){
				if(object.strokeWidth!=0){
					object.strokeWidth = that.width; 
					object.setCoords();
				}
			}
		});	
	}
	this.canvas2.renderAll();
	this.canvas2.calcOffset();
};

Whiteboard.prototype.setImage = function(imageBase64) {
    this.imageBase64 = imageBase64;
};

Whiteboard.prototype.setLatex = function(latexImage) {
    this.latexImage = latexImage+'&chs=75&chf=bg,s,00000000';
};

Whiteboard.prototype.setStyle = function(style) {
    this.style = style;
};

Whiteboard.prototype.setFunc = function(command) {
    this.command = command;
	if(command != 'erase' || command != 'partErase' ){
		this.ctx.globalCompositeOperation = 'source-over';
	}
};
	
Whiteboard.prototype.clear = function() {
    this.canvas2.clear();
	this.canvas2.backgroundColor='white';
	this.canvas2.renderAll();
    this.canvas2.calcOffset(); 	
	//background.width = background.width;
};

Whiteboard.prototype.bgClear = function() {
	//background.width = background.width;
};

Whiteboard.prototype.drawEnd = function() {
	this.savedImages.push(this.canvas.toDataURL("image/png"));
};

Whiteboard.prototype.handleTap = function(event) {
	var currentPoint = this.resolveMousePosition(event);
	console.log(currentPoint.x,currentPoint.y);
	
	if(this.command=='bgColor'){
		this.socket.send(JSON.stringify({
			msg: 'bgColor',
			data: {
				color: this.color,
			}
		}));
	}
	else if(this.command=='image'){
		this.lastPoint = this.resolveMousePosition(event);
		this.font = this.fontWeight + " " + this.fontStyle + " " + this.fontSize + "px " + this.fontFace;
		this.socket.send(JSON.stringify({
			msg: 'image',
			data: {
				color: this.color,
				image: this.image,
				font: this.font,
				points: [
					this.lastPoint.x,
					this.lastPoint.y
				]
			}
		}));
	}
	else if(this.command=='image'){
		this.lastPoint = this.resolveMousePosition(event);
		this.socket.send(JSON.stringify({
			msg: 'image',
			data: {
				imageBase64: this.imageBase64,
				points: [
					this.lastPoint.x,
					this.lastPoint.y
				]
			}
		}));
	}
};

Whiteboard.prototype.handleTapDown = function(event) {
    this.mouseDown = true;
	this.lastPoint = this.resolveMousePosition(event);
	
	if(this.command==='draw'||this.command==='erase'){
		this.socket.send(JSON.stringify({
			msg: 'drawEnd',
		}));
		//this.ctx.globalCompositeOperation = 'source-over';
	}
};

Whiteboard.prototype.handleTapUp = function(event) {
    this.mouseDown = false;
    var currentPoint = this.resolveMousePosition(event);

	if(this.command!=='draw'&&this.command!=='erase'){
		this.socket.send(JSON.stringify({
			msg: this.command+'2',
			data: {
				color: this.color,
				width: this.width,
				style: this.style,
				points: [
					this.lastPoint.x,
					this.lastPoint.y,
					currentPoint.x,
					currentPoint.y
				]
			}
		}));
	}
	else if (this.command==='erase'){
		this.socket.send(JSON.stringify({
			msg: 'eraseEnd',
		}));
	}
	
	//console.log(this.savedImages);
	
	this.lastPoint = null;
};

Whiteboard.prototype.handleTapMove = function(event) {
    if (!this.mouseDown) { return; }

	if(this.command=='image'||this.command=='bgColor'||this.command=='text')
		return;
	
    var currentPoint = this.resolveMousePosition(event);

    // Send a draw command to the server.
    // The actual line is drawn when the command
    // is received back from the server.

	if(this.command=='draw'||this.command=='erase')
		this.socket.send(JSON.stringify({
			msg: this.command,
			data: {
				color: this.color,
				width: this.width,
				points: [
					this.lastPoint.x,
					this.lastPoint.y,
					currentPoint.x,
					currentPoint.y
				]
			}
		}));
	else
	    this.socket.send(JSON.stringify({
        msg: this.command,
        data: {
            color: this.color,
			width: this.width,
			style: this.style,
            points: [
                this.lastPoint.x,
                this.lastPoint.y,
                currentPoint.x,
                currentPoint.y
            ]
        }
		}));
    
	if(this.command=='draw'||this.command=='erase')
		this.lastPoint = currentPoint;

};

Whiteboard.prototype.initCanvas = function(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);

    this.ctx = this.canvas.getContext('2d');
    this.initCanvasOffset();
};

Whiteboard.prototype.initCanvasOffset = function() {
    this.offsetX = this.offsetY = 0;
    var element = this.canvas;
    if (element.offsetParent) {
        do {
            this.offsetX += element.offsetLeft;
            this.offsetY += element.offsetTop;
        }
        while ((element = element.offsetParent));
    }
};

Whiteboard.prototype.addCanvasEventListeners = function() {
    // var hammer = new Hammer(canvas);	
	
	//hammer.on('tap',this.drawRect.bind(this)); 
	
	// hammer.on('tap',this.handleTap.bind(this)); 	
	// hammer.on('dragstart',this.handleTapDown.bind(this)); 
	// hammer.on('drag',this.handleTapMove.bind(this));
	// hammer.on('dragend',this.handleTapUp.bind(this));
	
	var formElement = document.getElementById("textBox");
	formElement.addEventListener("keyup", this.textBoxChanged.bind(this));		
	
	formElement = document.getElementById("textSize");
	formElement.addEventListener("change", this.textSizeChanged.bind(this));		
	
	formElement = document.getElementById("textFont");
	formElement.addEventListener("change", this.textFontChanged.bind(this));		
	
	formElement = document.getElementById("fontWeight");
	formElement.addEventListener("change", this.fontWeightChanged.bind(this));	
	
	formElement = document.getElementById("fontStyle");
	formElement.addEventListener("change", this.fontStyleChanged.bind(this));	
	
	formElement = document.getElementById("textBox2");
	formElement.addEventListener("keyup", this.textBoxChanged2.bind(this));		
	
	// formElement = document.getElementById("textSize2");
	// formElement.addEventListener("change", this.textSizeChanged2.bind(this));		
	
	formElement = document.getElementById("textFont2");
	formElement.addEventListener("change", this.textFontChanged2.bind(this));		
	
	formElement = document.getElementById("fontWeight2");
	formElement.addEventListener("change", this.fontWeightChanged2.bind(this));	
	
	formElement = document.getElementById("fontStyle2");
	formElement.addEventListener("change", this.fontStyleChanged2.bind(this));	
};

Whiteboard.prototype.resolveMousePosition = function(event) {
    var x, y;
	var e = event.gesture;

	x = e.touches[0].pageX - this.offsetX;
	y = e.touches[0].pageY - this.offsetY;
	
	return { x: x, y: y };

};

Whiteboard.prototype.textBoxChanged = function(e) {
	this.context = e.target.value;
};

Whiteboard.prototype.textSizeChanged = function(e) {
	console.log("Success 1");
	this.fontSize = e.target.value;
};

Whiteboard.prototype.textFontChanged = function(e) {
	console.log("Success 2");
	this.fontFace = e.target.value;
};

Whiteboard.prototype.fontWeightChanged = function(e) {
	console.log("Success 3");
	this.fontWeight = e.target.value;
};

Whiteboard.prototype.fontStyleChanged = function(e) {
	console.log("Success 4");
	this.fontStyle = e.target.value;
};

Whiteboard.prototype.textBoxChanged2 = function(e) {
	var activeObject = this.canvas2.getActiveObject();
	if (activeObject) {
		if(activeObject.type=='text'){
			activeObject.text = e.target.value;
			activeObject.setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			var json = JSON.stringify(this.canvas2.toJSON(['id']));
			this.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			this.removedImages = [];
			this.savedImages.push(this.currentImage);
			this.currentImage = json;
		}
		this.socket.send(JSON.stringify({
			msg: 'editText',
			data: {
				id: activeObject.id,
				text: activeObject.text
			}
		}));	
	}
};

Whiteboard.prototype.textFontChanged2 = function(e) {
	var activeObject = this.canvas2.getActiveObject();
	if (activeObject) {
		if(activeObject.type=='text'){
			activeObject.fontFamily = e.target.value;
			activeObject.setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			var json = JSON.stringify(this.canvas2.toJSON(['id']));
			this.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			this.removedImages = [];
			this.savedImages.push(this.currentImage);
			this.currentImage = json;
		}
		this.socket.send(JSON.stringify({
			msg: 'editFontFamily',
			data: {
				id: activeObject.id,
				fontFamily: activeObject.fontFamily
			}
		}));	
	}
};

Whiteboard.prototype.fontWeightChanged2 = function(e) {
	var activeObject = this.canvas2.getActiveObject();
	if (activeObject) {
		if(activeObject.type=='text'){
			activeObject.fontWeight = e.target.value;
			activeObject.setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			var json = JSON.stringify(this.canvas2.toJSON(['id']));
			this.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			this.removedImages = [];
			this.savedImages.push(this.currentImage);
			this.currentImage = json;
		}
		this.socket.send(JSON.stringify({
			msg: 'editFontWeight',
			data: {
				id: activeObject.id,
				fontWeight: activeObject.fontWeight
			}
		}));	
	}
};

Whiteboard.prototype.fontStyleChanged2 = function(e) {
	var activeObject = this.canvas2.getActiveObject();
	if (activeObject) {
		if(activeObject.type=='text'){
			activeObject.fontStyle = e.target.value;
			activeObject.setCoords();
			this.canvas2.renderAll();
			this.canvas2.calcOffset();
			var json = JSON.stringify(this.canvas2.toJSON(['id']));
			this.socket.send(JSON.stringify({
				msg: 'save',
				data: {
					json: json
				}
			}));
			this.removedImages = [];
			this.savedImages.push(this.currentImage);
			this.currentImage = json;
		}
		this.socket.send(JSON.stringify({
			msg: 'editFontStyle',
			data: {
				id: activeObject.id,
				fontStyle: activeObject.fontStyle
			}
		}));	
	}
};
