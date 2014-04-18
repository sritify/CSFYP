/* COLOR */
$(document).ready(function(){
	$("#color ul button").click(function(){
		$("#color .active").removeClass('active');
		$(this).closest( "li" ).addClass('active');
		colorsrc = $("#color .active img").attr("src");
		document.getElementById("colorimg").src = colorsrc;
	});
});


/* SIZE */
$(document).ready(function(){
	$("#size ul button").click(function(){
		$("#size .active").removeClass('active');
		$(this).closest( "li" ).addClass('active');
		sizesrc = $("#size .active img").attr("src");
		document.getElementById("sizeimg").src = sizesrc;
	});
});

/* TOOLS */
$(document).ready(function(){
	$("#tools ul button").click(function(){
		$("#tools .active").removeClass('active');
		$(this).closest( "li" ).addClass('active');
		$("#tools").addClass('active');
		toolsrc = $("#tools .active img").attr("src");
		document.getElementById("toolsimg").src = toolsrc;
	});
});

/* MENU */
$(document).ready(function(){
	$("#cssmenu > ul > li button").click(function(){
		$("#cssmenu > ul > .active").removeClass('active');
		$(this).closest( "li" ).addClass('active');
	});
});