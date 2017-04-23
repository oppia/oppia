;(function($, undefined) {
	function findCenter(elem) {
		var offset,
			document = $(elem.ownerDocument);
		elem = $(elem);
		offset = elem.offset();

		return {
			x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
			y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
		};
	}

	$.extend($.simulate.prototype, {
		simulateDragAndRevert: function() {
			var i = 0,
				target = this.target,
				options = this.options,
				center = findCenter(target),
				x = Math.floor(center.x),
				y = Math.floor(center.y),
				dx = options.dx || 0,
				dy = options.dy || 0,
				moves = options.moves || 3,
				coord = {
					clientX: x,
					clientY: y
				};

			this.simulateEvent(target, "mousedown", coord);

			for (; i < moves; i++) {
				x += dx / moves;
				y += dy / moves;

				coord = {
					clientX: Math.round(x),
					clientY: Math.round(y)
				};

				this.simulateEvent(document, "mousemove", coord);
			}

			for (i = 0; i < moves; i++) {
				x -= dx / moves;
				y -= dy / moves;

				coord = {
					clientX: Math.round(x),
					clientY: Math.round(y)
				};

				this.simulateEvent(document, "mousemove", coord);
			}

			this.simulateEvent(target, "mouseup", coord);
			this.simulateEvent(target, "click", coord);
		}
	});
})(jQuery);
