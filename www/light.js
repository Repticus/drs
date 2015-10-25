$(function() {
	$("#hands")
		.prepend('<img class="light" src="img/light3.png">')
		.prepend('<img class="light" src="img/light2.png">')
		.prepend('<img class="light" src="img/light1.png">');
	setLight();
	function setLight() {
		var interval = 1000;
		$("img.light:first")
			.fadeToggle(interval, function() {
				$(this).next().fadeToggle(interval, function() {
					$(this).prev().fadeToggle(interval, function() {
						$(this).next().next().fadeToggle(interval, function() {
							$(this).prev().fadeToggle(interval, function() {
								$(this).next().fadeToggle(interval, function() {
									setLight();
								});
							});
						});
					});
				});
			});
	}
});
