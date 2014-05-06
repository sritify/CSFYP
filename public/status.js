$(document).ready(function(){
	$("#show_status").mouseenter(function(){
		var get = 'id='+client.room;
		$.ajax({
			url: 'roomInfo',
			type: 'GET',
			data: get,
			success: function (data) {
				//var ret = jQuery.parseJSON(data);
				//console.log('Success: ', data);
				document.getElementById('status').innerHTML = data;
			},
			error: function (xhr, status, error) {
				//console.log('Error: ' + error.message);
			},
		});
		var show_status = $("#show_status").offset();
		var t = show_status.top;
		var l = show_status.left;
		$("#status").css({"top":t+23, "left":l-110});
		console.log(t,l);
		$("#status").slideDown(200);	
	});
	$("#show_status").mouseleave(function(){
		$("#status").slideUp(200);
	});

});(jQuery)