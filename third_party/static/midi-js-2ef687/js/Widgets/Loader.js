/* 
	----------------------------------------------------
	Loader.js : 0.4.2 : 2012/11/09
	----------------------------------------------------
	https://github.com/mudcube/Loader.js
	----------------------------------------------------
	/// Simple setup.
	var loader = new widgets.Loader;
	
	/// More complex setup.
	var loader = new widgets.Loader({
		id: "loader",
		bars: 12,
		radius: 0,
		lineWidth: 20,
		lineHeight: 70,
		timeout: 30, // maximum timeout in seconds.
		background: "rgba(0,0,0,0.5)",
		container: document.body,
		oncomplete: function() {
			// call function once loader has completed
		},
		onstart: function() {
			// call function once loader has started	
		}
	});
	
	/// Add a new message to the queue.
	var loaderId = loader.add({
		message: "test",
		getProgress: function() { // sends progress to loader.js
			return progress; // value between 1-100
		}
	});
	
	/// Remove a specific loader message.
	loader.remove(loaderId); 
	
	/// Recenter the loader within container (run onresize)
	loader.center(); 
	
	/// Stop all loader instances.
	loader.stop(); 
*/

if (typeof (widgets) === "undefined") var widgets = {};

(function() { "use strict";

var PI = Math.PI;
var noCanvas = !document.createElement("canvas").getContext;
var fadeOutSpeed = 400;
var defaultConfig = {
	id: "loader",
	bars: 12,
	radius: 0,
	lineWidth: 20,
	lineHeight: 70,
	timeout: 0,
	display: true
};

widgets.Loader = function (configure) {
	if (noCanvas) return;
	var that = this;
	if (typeof (configure) === "string") configure = { message: configure };
	if (typeof (configure) === "boolean") configure = { display: false };
	if (typeof (configure) === "undefined") configure = {};
	configure.container = configure.container || document.body;
	if (!configure.container) return;

	/// Mixin the default configurations.
	for (var key in defaultConfig) {
		if (typeof (configure[key]) === "undefined") {
			configure[key] = defaultConfig[key];
		}
	}

	/// Setup element
	var canvas = document.getElementById(configure.id);
	if (!canvas) {
		var div = document.createElement("div");
		var span = document.createElement("span");
		span.className = "message";
		div.appendChild(span);
		div.className = defaultConfig.id;
		div.style.cssText = transitionCSS("opacity", fadeOutSpeed);
		this.span = span;
		this.div = div;
		var canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		canvas.id = configure.id;
		canvas.style.cssText = "opacity: 1; position: absolute; z-index: 10000;";
		div.appendChild(canvas);
		configure.container.appendChild(div);
	} else {
		this.span = canvas.parentNode.getElementsByTagName("span")[0];
	}

	/// Configure
	var delay = configure.delay;
	var bars = configure.bars;
	var radius = configure.radius;
	var max = configure.lineHeight + 20;
	var size = max * 2 + configure.radius * 2;
	var windowSize = getWindowSize(configure.container);
	var width = windowSize.width - size;
	var height = windowSize.height - size;
	var deviceRatio = window.devicePixelRatio || 1;
	///
	canvas.width = size * deviceRatio;
	canvas.height = size  * deviceRatio;
	///
	var iteration = 0;
	var ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation = "lighter";
	ctx.shadowOffsetX = 1;
	ctx.shadowOffsetY = 1;
	ctx.shadowBlur = 1;
	ctx.shadowColor = "rgba(0, 0, 0, 0.5)";

	/// Public functions.
	this.messages = {};
	this.message = function (message, onstart) {
		if (!this.interval) return this.start(onstart, message);
		return this.add({
			message: message, 
			onstart: onstart
		});
	};
	
	this.update = function(id, message, percent) {
		if (!id) for (var id in this.messages);
		if (!id) return this.message(message);
		var item = this.messages[id];
		item.message = message;
		if (typeof(percent) === "number") item.span.innerHTML = percent + "%";
		if (message.substr(-3) === "...") { // animated dots
			item._message = message.substr(0, message.length - 3);
			item.messageAnimate = [".&nbsp;&nbsp;", "..&nbsp;", "..."].reverse();
		} else { // normal
			item._message = message;
			item.messageAnimate = false;
		}
		///
		item.element.innerHTML = message;
	};
	
	this.add = function (conf) {
		if (typeof(conf) === "string") conf = { message: conf };
		var background = configure.background ? configure.background : "rgba(0,0,0,0.65)";
		this.span.style.cssText = "background: " + background + ";";
		this.div.style.cssText = transitionCSS("opacity", fadeOutSpeed);
		if (this.stopPropagation) {
			this.div.style.cssText += "background: rgba(0,0,0,0.25);";
		} else {
			this.div.style.cssText += "pointer-events: none;";
		}
		///
		canvas.parentNode.style.opacity = 1;
		canvas.parentNode.style.display = "block";
		if (configure.background) this.div.style.background = configure.backgrond;
		///
		var timestamp = (new Date()).getTime();
		var seed = Math.abs(timestamp * Math.random() >> 0);
		var message = conf.message;
		///
		var container = document.createElement("div");
		container.style.cssText = transitionCSS("opacity", 500);
		var span = document.createElement("span");
		span.style.cssText = "float: right; width: 50px;";
		var node = document.createElement("span");
		node.innerHTML = message;
		///
		container.appendChild(node);
		container.appendChild(span);
		///
		var item = this.messages[seed] = {
			seed: seed,
			container: container,
			element: node,
			span: span,
			message: message,
			timeout: (conf.timeout || configure.timeout) * 1000,
			timestamp: timestamp,
			getProgress: conf.getProgress
		};
		this.span.appendChild(container);
		this.span.style.display = "block";
		this.update(item.seed, message);
		/// Escape event loop.
		if (conf.onstart) {
			window.setTimeout(conf.onstart, 50);
		}
		///
		this.center();
		///
		if (!this.interval) {
			if (!conf.delay) renderAnimation();
			window.clearInterval(this.interval);
			this.interval = window.setInterval(renderAnimation, 30);
		}
		/// Return identifier.
		return seed;
	};
	
	this.remove = function (seed) {
		iteration += 0.07;
		var timestamp = (new Date()).getTime();
		if (typeof(seed) === "object") seed = seed.join(":");
		if (seed) seed = ":" + seed + ":";
		/// Remove element.
		for (var key in this.messages) {
			var item = this.messages[key];
			if (!seed || seed.indexOf(":" + item.seed + ":") !== -1) {
				delete this.messages[item.seed];
				item.container.style.color = "#99ff88";
				removeChild(item);
				if (item.getProgress) item.span.innerHTML = "100%";
			}
		}
	};
	
	this.start = function (onstart, message) {
		if (!(message || configure.message)) return;
		return this.add({
			message: message || configure.message, 
			onstart: onstart
		});
	};
	
	this.stop = function () {
		this.remove();
		window.clearInterval(this.interval);
		delete this.interval;
		if (configure.oncomplete) configure.oncomplete();
		if (canvas && canvas.style) {
			div.style.cssText += "pointer-events: none;";
			window.setTimeout(function() {
				that.div.style.opacity = 0;
			}, 1);
			window.setTimeout(function () {
				if (that.interval) return;
				that.stopPropagation = false;
				canvas.parentNode.style.display = "none";
				ctx.clearRect(0, 0, size, size);
			}, fadeOutSpeed * 1000);
		}
	};

	this.center = function() {
		var windowSize = getWindowSize(configure.container);
		var width = windowSize.width - size;
		var height = windowSize.height - size;
		/// Center the animation within the content.
		canvas.style.left = (width / 2) + "px";
		canvas.style.top = (height / 2) + "px";
		canvas.style.width = (size) + "px";
		canvas.style.height = (size) + "px";
		that.span.style.top = (height / 2 + size - 10) + "px";
	};

	var style = document.createElement("style");
	style.innerHTML = '\
.loader { color: #fff; position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 100000; opacity: 0; display: none; }\
.loader span.message { font-family: monospace; font-size: 14px; margin: auto; opacity: 1; display: none; border-radius: 10px; padding: 0px; width: 300px; text-align: center; position: absolute; z-index: 10000; left: 0; right: 0; }\
.loader span.message div { border-bottom: 1px solid #222; padding: 5px 10px; clear: both; text-align: left; opacity: 1; }\
.loader span.message div:last-child { border-bottom: none; }\
';
	document.head.appendChild(style);
	/// Private functions.
	var removeChild = function(item) {
		window.setTimeout(function() { // timeout in case within same event loop.
			item.container.style.opacity = 0;
		}, 1);
		window.setTimeout(function() { // wait for opacity=0 before removing the element.
			item.container.parentNode.removeChild(item.container);
		}, 250);
	};
	var renderAnimation = function () {
		var timestamp = (new Date()).getTime();
		for (var key in that.messages) {
			var item = that.messages[key];
			var nid = iteration / 0.07 >> 0;
			if (nid % 5 === 0 && item.getProgress) {
				if (item.timeout && item.timestamp && timestamp - item.timestamp > item.timeout) {
					that.remove(item.seed);
					continue;
				}
				var progress = item.getProgress();
				if (progress >= 100) {
					that.remove(item.seed);
					continue;
				}
				item.span.innerHTML = (progress >> 0) + "%";
			}
			if (nid % 10 === 0) {
				if (item.messageAnimate) {
						var length = item.messageAnimate.length;
						var n = nid / 10 % length;
						var text = item._message + item.messageAnimate[n];
						item.element.innerHTML = text;
				}
			}
		}
		if (!key) {
			that.stop();
		}
		//
		ctx.save();
		ctx.clearRect(0, 0, size * deviceRatio, size * deviceRatio);
		ctx.scale(deviceRatio, deviceRatio);
		ctx.translate(size / 2, size / 2);
		var hues = 360 - 360 / bars;
		for (var i = 0; i < bars; i++) {
			var angle = (i / bars * 2 * PI) + iteration;
			ctx.save();
			ctx.translate(radius * Math.sin(-angle), radius * Math.cos(-angle));
			ctx.rotate(angle);
			// round-rect properties
			var x = -configure.lineWidth / 2;
			var y = 0;
			var width = configure.lineWidth;
			var height = configure.lineHeight;
			var curve = width / 2;
			// round-rect path
			ctx.beginPath();
			ctx.moveTo(x + curve, y);
			ctx.lineTo(x + width - curve, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + curve);
			ctx.lineTo(x + width, y + height - curve);
			ctx.quadraticCurveTo(x + width, y + height, x + width - curve, y + height);
			ctx.lineTo(x + curve, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - curve);
			ctx.lineTo(x, y + curve);
			ctx.quadraticCurveTo(x, y, x + curve, y);
			// round-rect fill
			var hue = ((i / (bars - 1)) * hues);
			ctx.fillStyle = "hsla(" + hue + ", 100%, 50%, 0.85)";
			ctx.fill();
			ctx.restore();
		}
		ctx.restore();
		iteration += 0.07;
	};
	//
	if (configure.display === false) return this;
	//
	this.start();
	//
	return this;
};

////

var transitionCSS = function(type, ms) {
	return '\
		-webkit-transition-property: '+type+';\
		-webkit-transition-duration: '+ms+'ms;\
		-moz-transition-property: '+type+';\
		-moz-transition-duration: '+ms+'ms;\
		-o-transition-property: '+type+';\
		-o-transition-duration: '+ms+'ms;\
		-ms-transition-property: '+type+';\
		-ms-transition-duration: '+ms+'ms;';
};

var getWindowSize = function (element) {
	if (window.innerWidth && window.innerHeight) {
		var width = window.innerWidth;
		var height = window.innerHeight;
	} else if (document.compatMode === "CSS1Compat" && document.documentElement && document.documentElement.offsetWidth) {
		var width = document.documentElement.offsetWidth;
		var height = document.documentElement.offsetHeight;
	} else if (document.body && document.body.offsetWidth) {
		var width = document.body.offsetWidth;
		var height = document.body.offsetHeight;
	}
	if (element) {
		var width = element.offsetWidth;
	}
	return {
		width: width,
		height: height
	};
};

})();