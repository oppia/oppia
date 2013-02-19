/*
	-----------------------------------------------------------
	MIDI.loadPlugin : 0.1.2 : 01/18/2012
	-----------------------------------------------------------
	https://github.com/mudcube/MIDI.js
	-----------------------------------------------------------
	MIDI.loadPlugin({
		instrument: "acoustic_grand_piano", // or 1 (default)
		instruments: [ "acoustic_grand_piano", "acoustic_guitar_nylon" ], // or multiple instruments
		callback: function() { }
	});
*/

if (typeof (MIDI) === "undefined") var MIDI = {};
if (typeof (MIDI.Soundfont) === "undefined") MIDI.Soundfont = {};

(function() { "use strict";

// Turn on to get "onprogress" event. XHR will not work from file://
var USE_XHR = false; 
var USE_JAZZMIDI = false;

MIDI.loadPlugin = function(conf) {
	if (typeof(conf) === "function") conf = {
		callback: conf
	};
	/// Get the instrument name.
	var instruments = conf.instruments || conf.instrument || "acoustic_grand_piano";
	if (typeof(instruments) !== "object") instruments = [ instruments ];
	instruments.map(function(data) {
		if (typeof(data) === "number") data = MIDI.GeneralMIDI.byId[data];
		return data;
	});
	///
	MIDI.soundfontUrl = conf.soundfontUrl || MIDI.soundfontUrl || "./soundfont/";
	/// Detect the best type of audio to use.
	MIDI.audioDetect(function(types) {
		var api = "";
		// use the most appropriate plugin if not specified
		if (apis[conf.api]) {
			api = conf.api;
		} else if (apis[window.location.hash.substr(1)]) {
			api = window.location.hash.substr(1);
		} else if (USE_JAZZMIDI && navigator.requestMIDIAccess) {
			api = "webmidi";
		} else if (window.webkitAudioContext) { // Chrome
			api = "webaudio";
		} else if (window.Audio) { // Firefox
			api = "audiotag";
		} else { // Internet Explorer
			api = "flash";
		}
		///
		if (!connect[api]) return;
		// use audio/ogg when supported
		var filetype = types["audio/ogg"] ? "ogg" : "mp3";
		// load the specified plugin
		connect[api](filetype, instruments, conf);
	});
};

///

var connect = {};

connect.webmidi = function(filetype, instruments, conf) {
	if (MIDI.loader) MIDI.loader.message("Web MIDI API...");
	MIDI.WebMIDI.connect(conf);
};

connect.flash = function(filetype, instruments, conf) {
	// fairly quick, but requires loading of individual MP3s (more http requests).
	if (MIDI.loader) MIDI.loader.message("Flash API...");
	DOMLoader.script.add({
		src: "./inc/SoundManager2/script/soundmanager2.js",
		verify: "SoundManager",
		callback: function () {
			MIDI.Flash.connect(conf);
		}
	});
};

connect.audiotag = function(filetype, instruments, conf) {
	if (MIDI.loader) MIDI.loader.message("HTML5 Audio API...");
	// works ok, kinda like a drunken tuna fish, across the board.
	var queue = createQueue({
		items: instruments,
		getNext: function(instrumentId) {
			if (USE_XHR) {
				DOMLoader.sendRequest({
					url: MIDI.soundfontUrl + instrumentId + "-" + filetype + ".js",
					onprogress: getPercent,
					onload: function (response) {
						MIDI.Soundfont[instrumentId] = JSON.parse(response.responseText);
						if (MIDI.loader) MIDI.loader.update(null, "Downloading", 100);
						queue.getNext();
					}
				});
			} else {
				DOMLoader.script.add({
					src: MIDI.soundfontUrl + instrumentId + "-" + filetype + ".js",
					verify: "MIDI.Soundfont." + instrumentId,
					callback: function() {
						if (MIDI.loader) MIDI.loader.update(null, "Downloading...", 100);
						queue.getNext();
					}
				});
			}
		},
		onComplete: function() {
			MIDI.AudioTag.connect(conf);
		}
	});
};

connect.webaudio = function(filetype, instruments, conf) {
	if (MIDI.loader) MIDI.loader.message("Web Audio API...");
	// works awesome! safari and chrome support
	var queue = createQueue({
		items: instruments,
		getNext: function(instrumentId) {
			if (USE_XHR) {
				DOMLoader.sendRequest({
					url: MIDI.soundfontUrl + instrumentId + "-" + filetype + ".js",
					onprogress: getPercent,
					onload: function(response) {
						MIDI.Soundfont[instrumentId] = JSON.parse(response.responseText);
						if (MIDI.loader) MIDI.loader.update(null, "Downloading...", 100);
						queue.getNext();
					}
				});
			} else {
				DOMLoader.script.add({
					src: MIDI.soundfontUrl + instrumentId + "-" + filetype + ".js",
					verify: "MIDI.Soundfont." + instrumentId,
					callback: function() {
						if (MIDI.loader) MIDI.loader.update(null, "Downloading...", 100);
						queue.getNext();
					}
				});
			}
		},
		onComplete: function() {
			MIDI.WebAudio.connect(conf);
		}
	});
};

/// Helpers

var apis = {
	"webmidi": true, 
	"webaudio": true, 
	"audiotag": true, 
	"flash": true 
};

var getPercent = function(event) {
	if (!this.totalSize) {
		if (this.getResponseHeader("Content-Length-Raw")) {
			this.totalSize = parseInt(this.getResponseHeader("Content-Length-Raw"));
		} else {
			this.totalSize = event.total;
		}
	}
	var percent = this.totalSize ? Math.round(event.loaded / this.totalSize * 100) : "";
	if (MIDI.loader) MIDI.loader.update(null, "Downloading...", percent);
};

var createQueue = function(conf) {
	var self = {};
	self.queue = [];
	for (var key in conf.items) {
		self.queue.push(conf.items[key]);
	}
	self.getNext = function() {
		if (!self.queue.length) return conf.onComplete();
		conf.getNext(self.queue.shift());
	};
	setTimeout(self.getNext, 1);
	return self;
};

})();