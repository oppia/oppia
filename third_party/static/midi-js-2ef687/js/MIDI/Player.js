/*
	-------------------------------------
	MIDI.Player : 0.3
	-------------------------------------
	https://github.com/mudcube/MIDI.js
	-------------------------------------
	#jasmid
	-------------------------------------
*/

if (typeof (MIDI) === "undefined") var MIDI = {};
if (typeof (MIDI.Player) === "undefined") MIDI.Player = {};

(function() { "use strict";

var root = MIDI.Player;
root.callback = undefined; // your custom callback goes here!
root.currentTime = 0;
root.endTime = 0; 
root.restart = 0; 
root.playing = false;
root.timeWarp = 1;

//
root.start =
root.resume = function () {
	if (root.currentTime < -1) root.currentTime = -1;
	startAudio(root.currentTime);
};

root.pause = function () {
	var tmp = root.restart;
	stopAudio();
	root.restart = tmp;
};

root.stop = function () {
	stopAudio();
	root.restart = 0;
	root.currentTime = 0;
};

root.addListener = function(callback) {
	onMidiEvent = callback;
};

root.removeListener = function() {
	onMidiEvent = undefined;
};

root.clearAnimation = function() {
	if (root.interval)  {
		window.clearInterval(root.interval);
	}
};

root.setAnimation = function(config) {
	var callback = (typeof(config) === "function") ? config : config.callback;
	var interval = config.interval || 30;
	var currentTime = 0;
	var tOurTime = 0;
	var tTheirTime = 0;
	//
	root.clearAnimation();
	root.interval = window.setInterval(function () {
		if (root.endTime === 0) return;
		if (root.playing) {
			currentTime = (tTheirTime === root.currentTime) ? tOurTime - (new Date).getTime() : 0;
			if (root.currentTime === 0) {
				currentTime = 0;
			} else {
				currentTime = root.currentTime - currentTime;
			}
			if (tTheirTime !== root.currentTime) {
				tOurTime = (new Date).getTime();
				tTheirTime = root.currentTime;
			}
		} else { // paused
			currentTime = root.currentTime;
		}
		var endTime = root.endTime;
		var percent = currentTime / endTime;
		var total = currentTime / 1000;
		var minutes = total / 60;
		var seconds = total - (minutes * 60);
		var t1 = minutes * 60 + seconds;
		var t2 = (endTime / 1000);
		if (t2 - t1 < -1) return;
		callback({
			now: t1,
			end: t2,
			events: noteRegistrar
		});
	}, interval);
};

// helpers

root.loadMidiFile = function() { // reads midi into javascript array of events
	root.replayer = new Replayer(MidiFile(root.currentData), root.timeWarp);
	root.data = root.replayer.getData();
	root.endTime = getLength();
};

root.loadFile = function (file, callback) {
	root.stop();
	if (file.indexOf("base64,") !== -1) {
		var data = window.atob(file.split(",")[1]);
		root.currentData = data;
		root.loadMidiFile();
		if (callback) callback(data);
		return;
	}
	///
	var fetch = new XMLHttpRequest();
	fetch.open('GET', file);
	fetch.overrideMimeType("text/plain; charset=x-user-defined");
	fetch.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			var t = this.responseText || "";
			var ff = [];
			var mx = t.length;
			var scc = String.fromCharCode;
			for (var z = 0; z < mx; z++) {
				ff[z] = scc(t.charCodeAt(z) & 255);
			}
			var data = ff.join("");
			root.currentData = data;
			root.loadMidiFile();
			if (callback) callback(data);
		}
	};
	fetch.send();
};

// Playing the audio

var eventQueue = []; // hold events to be triggered
var queuedTime; // 
var startTime = 0; // to measure time elapse
var noteRegistrar = {}; // get event for requested note
var onMidiEvent = undefined; // listener callback
var scheduleTracking = function (channel, note, currentTime, offset, message, velocity) {
	var interval = window.setTimeout(function () {
		var data = {
			channel: channel,
			note: note,
			now: currentTime,
			end: root.endTime,
			message: message,
			velocity: velocity
		};
		//
		if (message === 128) {
			delete noteRegistrar[note];
		} else {
			noteRegistrar[note] = data;
		}
		if (onMidiEvent) {
			onMidiEvent(data);
		}
		root.currentTime = currentTime;
		if (root.currentTime === queuedTime && queuedTime < root.endTime) { // grab next sequence
			startAudio(queuedTime, true);
		}
	}, currentTime - offset);
	return interval;
};

var getContext = function() {
	if (MIDI.lang === 'WebAudioAPI') {
		return MIDI.Player.ctx;
	} else if (!root.ctx) {
		root.ctx = { currentTime: 0 };
	}
	return root.ctx;
};

var getLength = function() {
	var data =  root.data;
	var length = data.length;
	var totalTime = 0.5;
	for (var n = 0; n < length; n++) {
		totalTime += data[n][1];
	}
	return totalTime;
};

var startAudio = function (currentTime, fromCache) {
	if (!root.replayer) return;
	if (!fromCache) {
		if (typeof (currentTime) === "undefined") currentTime = root.restart;
		if (root.playing) stopAudio();
		root.playing = true;
		root.data = root.replayer.getData();
		root.endTime = getLength();
	}
	var note;
	var offset = 0;
	var messages = 0;
	var data = root.data;	
	var ctx = getContext();
	var length = data.length;
	//
	queuedTime = 0.5;
	startTime = ctx.currentTime;
	//
	for (var n = 0; n < length && messages < 100; n++) {
		queuedTime += data[n][1];
		if (queuedTime < currentTime) {
			offset = queuedTime;
			continue;
		}
		currentTime = queuedTime - offset;
		var event = data[n][0].event;
		if (event.type !== "channel") continue;
		var channel = event.channel;
		switch (event.subtype) {
			case 'noteOn':
				if (MIDI.channels[channel].mute) break;
				note = event.noteNumber - (root.MIDIOffset || 0);
				eventQueue.push({
					event: event,
					source: MIDI.noteOn(channel, event.noteNumber, event.velocity, currentTime / 1000 + ctx.currentTime),
					interval: scheduleTracking(channel, note, queuedTime, offset, 144, event.velocity)
				});
				messages ++;
				break;
			case 'noteOff':
				if (MIDI.channels[channel].mute) break;
				note = event.noteNumber - (root.MIDIOffset || 0);
				eventQueue.push({
					event: event,
					source: MIDI.noteOff(channel, event.noteNumber, currentTime / 1000 + ctx.currentTime),
					interval: scheduleTracking(channel, note, queuedTime, offset, 128)
				});
				break;
			default:
				break;
		}
	}
};

var stopAudio = function () {
	var ctx = getContext();
	root.playing = false;
	root.restart += (ctx.currentTime - startTime) * 1000;
	// stop the audio, and intervals
	while (eventQueue.length) {
		var o = eventQueue.pop();
		window.clearInterval(o.interval);
		if (!o.source) continue; // is not webaudio
		if (typeof(o.source) === "number") {
			window.clearTimeout(o.source);
		} else { // webaudio
			o.source.disconnect(0);
		}
	}
	// run callback to cancel any notes still playing
	for (var key in noteRegistrar) {
		var o = noteRegistrar[key]
		if (noteRegistrar[key].message === 144 && onMidiEvent) {
			onMidiEvent({
				channel: o.channel,
				note: o.note,
				now: o.now,
				end: o.end,
				message: 128,
				velocity: o.velocity
			});
		}
	}
	// reset noteRegistrar
	noteRegistrar = {};
};

})();