/*
	Soundfont Builder : 0.1
*/

window = {}; // create fake window
atob = require('atob');
btoa = require('btoa');
http = require('http');
fs = require('fs');
///
require('./jsmidi.js');

//////////////

var min = window.noteTable["C2"];
var max = window.noteTable["C7"];
var absmin = window.noteTable["A0"];
var absmax = window.noteTable["C8"] + 1;
if (false) {
	var noteEvents = [];
	for (var key in window.noteTable) {
		var id = window.noteTable[key];
		if (id < absmin || id > absmax) continue;
	//	if (id < min || id > max) continue;
		var note = {
			duration: 0,
			channel: 0,
			pitch: id,
			volume: 100
		};
		noteEvents.push(window.MidiEvent.noteOn(note));
		note.duration = 1024 * 0.75 >> 0;
		noteEvents.push(window.MidiEvent.noteOff(note));
	}
	var track = new window.MidiTrack({ 
		events: noteEvents
	});
	var song  = window.MidiWriter({ 
		tracks: [track]
	});
	var decoded = new Buffer(atob(song.b64), 'binary')
	fs.writeFile('build/SoundFont.midi', decoded, 'binary', function(err) {});
} else {
	for (var key in window.noteTable) {
		var id = window.noteTable[key];
		if (id < absmin || id > absmax) continue;
	//	if (id < min || id > max) continue;
		var note = {
			duration: 0,
			channel: 0,
			pitch: id,
			volume: 85
		};
		var noteEvents = [];
		noteEvents.push(window.MidiEvent.noteOn(note));
		note.duration = 1024 * 0.75 >> 0;
		noteEvents.push(window.MidiEvent.noteOff(note));
		var track = new window.MidiTrack({ 
			events: noteEvents
		});
		var song  = window.MidiWriter({ 
			tracks: [track]
		});
		var decoded = new Buffer(atob(song.b64), 'binary')
		fs.writeFile('build/' + key + '.midi', decoded, 'binary', function(err) {});
	}
}