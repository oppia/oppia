/*
	----------------------------------------
	window.Queue : 0.1.1 : http://mudcu.be
	----------------------------------------
	var queue = new Queue({
		items: list,
		oncomplete: function() {
			queue.reset(); // infinite loop!
			queue.next();
		},
		next: function(item) {
			if (item[0] !== "." && item.indexOf(".") === -1) {
				readDir(dir + item + "/", queue.next);
			} else {
				setTimeout(queue.next, 1)
			}
		}
	});
*/

if (typeof(window) === "undefined") window = {};

window.Queue = function(conf) {
	var that = this;
	/// Request the next item in stack.
	this.next = function() {
		var arr = that.queue;
		/// Emit the progress of the queue.
		if (conf.onprogress) {
			conf.onprogress(that.length ? 1 - that.remaining / that.length : 1);
		}
		/// Check whether the queue is complete.
		if (!arr.length) {
			if (conf.oncomplete) {
				conf.oncomplete();
			}
			return;
		}
		/// Indicate previous element as processed.
		that.remaining --;
		/// Cleanup previous completed dimension.

		if (String(arr[0]) === "[object Object]" && !arr[0].length) {
			arr.shift();
		}
		/// Process next item in multi-dimensional stack.
		if (String(arr[0]) === "[object Object]" && arr[0].length) {
			conf.next(arr[0].shift());
		} else { // ditto for single-dimensional stack.
			conf.next(arr.shift());
		}
	};
	/// 
	this.reset = function(items) {
		items = items || conf.items;
		this.length = 0;
		this.remaining = -1;
		this.queue = [];
		/// Flatten multi-dimensional objects.
		for (var key in items) {
			if (String(items[key]) === "[object Object]") {
				var sub = [];
				this.queue.push(sub);
				for (var id in items[key]) {
					sub.push(items[key][id]);
					this.length ++;
					this.remaining ++;
				}
			} else {
				this.queue.push(items[key]);
				this.length ++;
				this.remaining ++;
			}
		}
	};
	///
	this.reset();
	/// Escape event loop.
	setTimeout(this.next, 1);
	///
	return this;
};

/// For NodeJS
if (typeof (module) !== "undefined" && module.exports) {
	module.exports = window.Queue;
}