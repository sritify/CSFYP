$(document).ready(function(){
		var window_h = $(window).height();
		var window_w = $(window).width();
		var control_h = $("#control").height();
		var control_w = $("#control").width();
		$('body').width(window_w).height(window_h*0.93);
		$(".content").width(window_w*0.75).height((window_h-control_h)*0.93);
		$(".sidebar2").width(window_w*0.246).height((window_h-control_h)*0.93);
		$("#conversation").height(($(".sidebar2").height())-($("#chat_info").height()) -60);
		$(window).resize(function(){
			window_h = $(window).height();
			window_w = $(window).width();
			control_h = $("#control").height();
			control_w = $("#control").width();
			$('body').width(window_w).height(window_h*0.93);
			$(".content").width(window_w*0.75).height((window_h-control_h)*0.93);
			$(".sidebar2").width(window_w*0.246).height((window_h-control_h)*0.93);
			$("#conversation").height(($(".sidebar2").height())-($("#chat_info").height()) -60);
		})
});(jQuery)