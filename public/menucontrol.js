$(document).ready(function(){
	$(".control_menu, .control_tool").hover(function(){
		$(this).addClass("hovering");
		},function(){
		$(this).removeClass("hovering");
	});
	
	$(".holdable").mousedown(function(){
		$(".active_menu").removeClass("active_menu");
		$(this).addClass("active_menu");
	});
	
	$("#tool").mousedown(function(){
		$(".toolbar > ul").slideToggle(200);
	});
	
	$(".control_menu, canvas").not("#tool").mousedown(function(){
		$(".toolbar > ul").slideUp(200);
	});
	
	$(".control_tool").mousedown(function(){
		$(".active_tool").removeClass("active_tool");
		$(this).addClass("active_tool");
		toolsrc = $(".active_tool img").attr("src");
		document.getElementById("toolsimg").src = toolsrc;
		$(".toolbar > ul").slideUp(200);
	});
	
	$("#pencil").click(function(){
		$("#tool").attr("onclick","setFunc('draw')");
	});
	$("#rectangle").click(function(){
		$("#tool").attr("onclick","setFunc('drawRect')");
	});
	$("#square").click(function(){
		$("#tool").attr("onclick","setFunc('drawSquare')");
	});
	$("#oval").click(function(){
		$("#tool").attr("onclick","setFunc('drawOval')");
	});
	$("#circle").click(function(){
		$("#tool").attr("onclick","setFunc('drawCircle')");
	});
	$("#line").click(function(){
		$("#tool").attr("onclick","setFunc('drawLine')");
	});
});
