/*
	--------------------------------------------
	MIDI.Plugin : 0.3.2 : 2013/01/26
	--------------------------------------------
	https://github.com/mudcube/MIDI.js
	--------------------------------------------
	Inspired by javax.sound.midi (albeit a super simple version): 
		http://docs.oracle.com/javase/6/docs/api/javax/sound/midi/package-summary.html
	--------------------------------------------
	Technologies:
		MIDI.WebMIDI
		MIDI.WebAudio
		MIDI.Flash
		MIDI.AudioTag
	--------------------------------------------
	Helpers:
		MIDI.GeneralMIDI
		MIDI.channels
		MIDI.keyToNote
		MIDI.noteToKey
*/

if (typeof (MIDI) === "undefined") var MIDI = {};

(function() { "use strict";

var setPlugin = function(root) {
	MIDI.api = root.api;
	MIDI.setVolume = root.setVolume;
	MIDI.programChange = root.programChange;
	MIDI.noteOn = root.noteOn;
	MIDI.noteOff = root.noteOff;
	MIDI.chordOn = root.chordOn;
	MIDI.chordOff = root.chordOff;
	MIDI.stopAllNotes = root.stopAllNotes;
	MIDI.getInput = root.getInput;
	MIDI.getOutputs = root.getOutputs;
};

/*
	--------------------------------------------
	Web MIDI API - Native Soundbank
	--------------------------------------------
	https://dvcs.w3.org/hg/audio/raw-file/tip/midi/specification.html
	--------------------------------------------
*/

(function () {
	var plugin = null;
	var output = null;
	var channels = [];
	var root = MIDI.WebMIDI = {
		api: "webmidi"
	};
	root.setVolume = function (channel, volume) { // set channel volume
		output.send([0xB0 + channel, 0x07, volume]);
	};

	root.programChange = function (channel, program) { // change channel instrument
		output.send([0xC0 + channel, program]);
	};

	root.noteOn = function (channel, note, velocity, delay) {
		output.send([0x90 + channel, note, velocity], delay * 1000);
	};

	root.noteOff = function (channel, note, delay) {
		output.send([0x80 + channel, note, 0], delay * 1000);
	};

	root.chordOn = function (channel, chord, velocity, delay) {
		for (var n = 0; n < chord.length; n ++) {
			var note = chord[n];
			output.send([0x90 + channel, note, velocity], delay * 1000);
		}
	};
	
	root.chordOff = function (channel, chord, delay) {
		for (var n = 0; n < chord.length; n ++) {
			var note = chord[n];
			output.send([0x80 + channel, note, 0], delay * 1000);
		}
	};
	
	root.stopAllNotes = function () {
		for (var channel = 0; channel < 16; channel ++) {
			output.send([0xB0 + channel, 0x7B, 0]);
		}
	};

	root.getInput = function () {
		return plugin.getInputs();
	};
	
	root.getOutputs = function () {
		return plugin.getOutputs();
	};

	root.connect = function (conf) {
		setPlugin(root);
        navigator.requestMIDIAccess().then(function (access) {
			plugin = access;
			output = plugin.outputs()[0];
			if (conf.callback) conf.callback();
		}, function (err) { // well at least we tried!
			if (window.AudioContext || window.webkitAudioContext) { // Chrome
				conf.api = "webaudio";
			} else if (window.Audio) { // Firefox
				conf.api = "audiotag";
			} else { // Internet Explorer
				conf.api = "flash";
			}
			MIDI.loadPlugin(conf);
		});
	};
})();

/*
	--------------------------------------------
	Web Audio API - OGG or MPEG Soundbank
	--------------------------------------------
	https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
	--------------------------------------------
*/

if (window.AudioContext || window.webkitAudioContext) (function () {

	var AudioContext = window.AudioContext || window.webkitAudioContext;
	var root = MIDI.WebAudio = {
		api: "webaudio"
	};
	var ctx;
	var sources = {};
	var masterVolume = 127;
	var audioBuffers = {};
	var audioLoader = function (instrument, urlList, index, bufferList, callback) {
		var synth = MIDI.GeneralMIDI.byName[instrument];
		var instrumentId = synth.number;
		var url = urlList[index];
		if (!MIDI.Soundfont[instrument][url]) { // missing soundfont
			return callback(instrument);
		}
		var base64 = MIDI.Soundfont[instrument][url].split(",")[1];
		var buffer = Base64Binary.decodeArrayBuffer(base64);
		ctx.decodeAudioData(buffer, function (buffer) {
			var msg = url;
			while (msg.length < 3) msg += "&nbsp;";
			if (typeof (MIDI.loader) !== "undefined") {
				MIDI.loader.update(null, synth.instrument + "<br>Processing: " + (index / 87 * 100 >> 0) + "%<br>" + msg);
			}
			buffer.id = url;
			bufferList[index] = buffer;
			//
			if (bufferList.length === urlList.length) {
				while (bufferList.length) {
					buffer = bufferList.pop();
					if (!buffer) continue;
					var nodeId = MIDI.keyToNote[buffer.id];
					audioBuffers[instrumentId + "" + nodeId] = buffer;
				}
				callback(instrument);
			}
		});
	};

	root.setVolume = function (channel, volume) {
		masterVolume = volume;
	};

	root.programChange = function (channel, program) {
		MIDI.channels[channel].instrument = program;
	};

	root.noteOn = function (channel, note, velocity, delay) {
		/// check whether the note exists
		if (!MIDI.channels[channel]) return;
		var instrument = MIDI.channels[channel].instrument;
		if (!audioBuffers[instrument + "" + note]) return;
		/// convert relative delay to absolute delay
		if (delay < ctx.currentTime) delay += ctx.currentTime;
		/// crate audio buffer
		var source = ctx.createBufferSource();
		sources[channel + "" + note] = source;
		source.buffer = audioBuffers[instrument + "" + note];
		source.connect(ctx.destination);
		///
		if (ctx.createGain) { // firefox
			source.gainNode = ctx.createGain();
		} else { // chrome
			source.gainNode = ctx.createGainNode();
		}
		var value = (velocity / 127) * (masterVolume / 127) * 2 - 1;
		source.gainNode.connect(ctx.destination);
		source.gainNode.gain.value = Math.max(-1, value);
		source.connect(source.gainNode);
		if (source.noteOn) { // old api
			source.noteOn(delay || 0);
		} else { // new api
			source.start(delay || 0);
		}
		return source;
	};

	root.noteOff = function (channel, note, delay) {
		delay = delay || 0;
		if (delay < ctx.currentTime) delay += ctx.currentTime;
		var source = sources[channel + "" + note];
		if (!source) return;
		if (source.gainNode) {
			// @Miranet: "the values of 0.2 and 0.3 could ofcourse be used as 
			// a 'release' parameter for ADSR like time settings."
			// add { "metadata": { release: 0.3 } } to soundfont files
			var gain = source.gainNode.gain;
			gain.linearRampToValueAtTime(gain.value, delay);
			gain.linearRampToValueAtTime(-1, delay + 0.2);
		}
		if (source.noteOff) { // old api
			source.noteOff(delay + 0.3);
		} else {
			source.stop(delay + 0.3);
		}
		///
		delete sources[channel + "" + note];
	};

	root.chordOn = function (channel, chord, velocity, delay) {
		var ret = {}, note;
		for (var n = 0, length = chord.length; n < length; n++) {
			ret[note = chord[n]] = root.noteOn(channel, note, velocity, delay);
		}
		return ret;
	};

	root.chordOff = function (channel, chord, delay) {
		var ret = {}, note;
		for (var n = 0, length = chord.length; n < length; n++) {
			ret[note = chord[n]] = root.noteOff(channel, note, delay);
		}
		return ret;
	};

    root.stopAllNotes = function () {
        for (var source in sources) {
            var delay = 0;
            if (delay < ctx.currentTime) delay += ctx.currentTime;
            // @Miranet: "the values of 0.2 and 0.3 could ofcourse be used as
            // a 'release' parameter for ADSR like time settings."
            // add { "metadata": { release: 0.3 } } to soundfont files
            sources[source].gain.linearRampToValueAtTime(1, delay);
            sources[source].gain.linearRampToValueAtTime(0, delay + 0.2);
            sources[source].noteOff(delay + 0.3);
            delete sources[source];
        }
    };

	root.connect = function (conf) {
		setPlugin(root);
		//
		MIDI.Player.ctx = ctx = new AudioContext();
		///
		var urlList = [];
		var keyToNote = MIDI.keyToNote;
		for (var key in keyToNote) urlList.push(key);
		var bufferList = [];
		var pending = {};
		var oncomplete = function(instrument) {
			delete pending[instrument];
			for (var key in pending) break;
			if (!key) conf.callback();
		};
		for (var instrument in MIDI.Soundfont) {
			pending[instrument] = true;
			for (var i = 0; i < urlList.length; i++) {
				audioLoader(instrument, urlList, i, bufferList, oncomplete);
			}
		}
	};
})();

/*
	--------------------------------------------
	AudioTag <audio> - OGG or MPEG Soundbank
	--------------------------------------------
	http://dev.w3.org/html5/spec/Overview.html#the-audio-element
	--------------------------------------------
*/

if (window.Audio) (function () {

	var root = MIDI.AudioTag = {
		api: "audiotag"
	};
	var note2id = {};
	var volume = 127; // floating point 
	var channel_nid = -1; // current channel
	var channels = []; // the audio channels
	var channelInstrumentNoteIds = []; // instrumentId + noteId that is currently playing in each 'channel', for routing noteOff/chordOff calls
	var notes = {}; // the piano keys
	for (var nid = 0; nid < 12; nid++) {
		channels[nid] = new Audio();
	}

	var playChannel = function (channel, note) {
		if (!MIDI.channels[channel]) return;
		var instrument = MIDI.channels[channel].instrument;
		var instrumentId = MIDI.GeneralMIDI.byId[instrument].id;
		var note = notes[note];
		if (!note) return;
		var instrumentNoteId = instrumentId + "" + note.id;
		var nid = (channel_nid + 1) % channels.length;
		var audio = channels[nid];
		channelInstrumentNoteIds[ nid ] = instrumentNoteId;
		audio.src = MIDI.Soundfont[instrumentId][note.id];
		audio.volume = volume / 127;
		audio.play();
		channel_nid = nid;
	};

	var stopChannel = function (channel, note) {
		if (!MIDI.channels[channel]) return;
		var instrument = MIDI.channels[channel].instrument;
		var instrumentId = MIDI.GeneralMIDI.byId[instrument].id;
		var note = notes[note];
		if (!note) return;
		var instrumentNoteId = instrumentId + "" + note.id;

		for(var i=0;i<channels.length;i++){
			var nid = (i + channel_nid + 1) % channels.length;
			var cId = channelInstrumentNoteIds[nid];

			if(cId && cId == instrumentNoteId){
				channels[nid].pause();
				channelInstrumentNoteIds[nid] = null;
				return;
			}
		}
	};

	root.programChange = function (channel, program) {
		MIDI.channels[channel].instrument = program;
	};

	root.setVolume = function (channel, n) {
		volume = n; //- should be channel specific volume
	};

	root.noteOn = function (channel, note, velocity, delay) {
		var id = note2id[note];
		if (!notes[id]) return;
		if (delay) {
			return window.setTimeout(function () {
				playChannel(channel, id);
			}, delay * 1000);
		} else {
			playChannel(channel, id);
		}
	};
	
	root.noteOff = function (channel, note, delay) {
		var id = note2id[note];
		if (!notes[id]) return;
		if (delay) {
			return setTimeout(function() {
				stopChannel(channel, id);
			}, delay * 1000)
		} else {
			stopChannel(channel, id);
		}
	};
	
	root.chordOn = function (channel, chord, velocity, delay) {
		for (var idx = 0; idx < chord.length; idx ++) {
			var n = chord[idx];
			var id = note2id[n];
			if (!notes[id]) continue;
			if (delay) {
				return window.setTimeout(function () {
					playChannel(channel, id);
				}, delay * 1000);
			} else {
				playChannel(channel, id);
			}
		}
	};
	
	root.chordOff = function (channel, chord, delay) {
		for (var idx = 0; idx < chord.length; idx ++) {
			var n = chord[idx];
			var id = note2id[n];
			if (!notes[id]) continue;
			if (delay) {
				return window.setTimeout(function () {
					stopChannel(channel, id);
				}, delay * 1000);
			} else {
				stopChannel(channel, id);
			}
		}
	};
	
	root.stopAllNotes = function () {
		for (var nid = 0, length = channels.length; nid < length; nid++) {
			channels[nid].pause();
		}
	};
	
	root.connect = function (conf) {
		for (var key in MIDI.keyToNote) {
			note2id[MIDI.keyToNote[key]] = key;
			notes[key] = {
				id: key
			};
		}
		setPlugin(root);
		///
		if (conf.callback) conf.callback();
	};
})();

/*
	--------------------------------------------
	Flash - MP3 Soundbank
	--------------------------------------------
	http://www.schillmania.com/projects/soundmanager2/
	--------------------------------------------
*/
	
(function () {

	var root = MIDI.Flash = {
		api: "flash"
	};
	var noteReverse = {};
	var notes = {};

	root.programChange = function (channel, program) {
		MIDI.channels[channel].instrument = program;
	};

	root.setVolume = function (channel, note) {

	};

	root.noteOn = function (channel, note, velocity, delay) {
		if (!MIDI.channels[channel]) return;
		var instrument = MIDI.channels[channel].instrument;
		var id = MIDI.GeneralMIDI.byId[instrument].number;
		note = id + "" + noteReverse[note];
		if (!notes[note]) return;
		if (delay) {
			return window.setTimeout(function() { 
				notes[note].play({ volume: velocity * 2 });
			}, delay * 1000);
		} else {
			notes[note].play({ volume: velocity * 2 });
		}
	};

	root.noteOff = function (channel, note, delay) {

	};

	root.chordOn = function (channel, chord, velocity, delay) {
		if (!MIDI.channels[channel]) return;
		var instrument = MIDI.channels[channel].instrument;
		var id = MIDI.GeneralMIDI.byId[instrument].number;
		for (var key in chord) {
			var n = chord[key];
			var note = id + "" + noteReverse[n];
			if (notes[note]) {
				notes[note].play({ volume: velocity * 2 });
			}
		}
	};

	root.chordOff = function (channel, chord, delay) {

	};

	root.stopAllNotes = function () {

	};

	root.connect = function (instruments, conf) {
		soundManager.flashVersion = 9;
		soundManager.useHTML5Audio = true;
		soundManager.url = conf.soundManagerSwfUrl || '../inc/SoundManager2/swf/';
		soundManager.useHighPerformance = true;
		soundManager.wmode = 'transparent';
		soundManager.flashPollingInterval = 1;
		soundManager.debugMode = false;
		soundManager.onload = function () {
			var createBuffer = function(instrument, id, onload) {
				var synth = MIDI.GeneralMIDI.byName[instrument];
				var instrumentId = synth.number;
				notes[instrumentId+""+id] = soundManager.createSound({
					id: id,
					url: MIDI.soundfontUrl + instrument + "-mp3/" + id + ".mp3",
					multiShot: true,
					autoLoad: true,
					onload: onload
				});			
			};
			var loaded = [];
			var samplesPerInstrument = 88;
			var samplesToLoad = instruments.length * samplesPerInstrument;
				
			for (var i = 0; i < instruments.length; i++) {
				var instrument = instruments[i];
				var onload = function () {
					loaded.push(this.sID);
					if (typeof (MIDI.loader) === "undefined") return;
					MIDI.loader.update(null, "Processing: " + this.sID);
				};
				for (var j = 0; j < samplesPerInstrument; j++) {
					var id = noteReverse[j + 21];
					createBuffer(instrument, id, onload);
				}
			}
			///
			setPlugin(root);
			//
			var interval = window.setInterval(function () {
				if (loaded.length < samplesToLoad) return;
				window.clearInterval(interval);
				if (conf.callback) conf.callback();
			}, 25);
		};
		soundManager.onerror = function () {

		};
		for (var key in MIDI.keyToNote) {
			noteReverse[MIDI.keyToNote[key]] = key;
		}
	};
})();

/*
	helper functions
*/

// instrument-tracker
MIDI.GeneralMIDI = (function (arr) {
	var clean = function(v) {
		return v.replace(/[^a-z0-9 ]/gi, "").replace(/[ ]/g, "_").toLowerCase();
	};
	var ret = {
		byName: {},
		byId: {},
		byCategory: {}
	};
	for (var key in arr) {
		var list = arr[key];
		for (var n = 0, length = list.length; n < length; n++) {
			var instrument = list[n];
			if (!instrument) continue;
			var num = parseInt(instrument.substr(0, instrument.indexOf(" ")), 10);
			instrument = instrument.replace(num + " ", "");
			ret.byId[--num] = 
			ret.byName[clean(instrument)] = 
			ret.byCategory[clean(key)] = {
				id: clean(instrument),
				instrument: instrument,
				number: num,
				category: key
			};
		}
	}
	return ret;
})({
	'Piano': ['1 Acoustic Grand Piano', '2 Bright Acoustic Piano', '3 Electric Grand Piano', '4 Honky-tonk Piano', '5 Electric Piano 1', '6 Electric Piano 2', '7 Harpsichord', '8 Clavinet'],
	'Chromatic Percussion': ['9 Celesta', '10 Glockenspiel', '11 Music Box', '12 Vibraphone', '13 Marimba', '14 Xylophone', '15 Tubular Bells', '16 Dulcimer'],
	'Organ': ['17 Drawbar Organ', '18 Percussive Organ', '19 Rock Organ', '20 Church Organ', '21 Reed Organ', '22 Accordion', '23 Harmonica', '24 Tango Accordion'],
	'Guitar': ['25 Acoustic Guitar (nylon)', '26 Acoustic Guitar (steel)', '27 Electric Guitar (jazz)', '28 Electric Guitar (clean)', '29 Electric Guitar (muted)', '30 Overdriven Guitar', '31 Distortion Guitar', '32 Guitar Harmonics'],
	'Bass': ['33 Acoustic Bass', '34 Electric Bass (finger)', '35 Electric Bass (pick)', '36 Fretless Bass', '37 Slap Bass 1', '38 Slap Bass 2', '39 Synth Bass 1', '40 Synth Bass 2'],
	'Strings': ['41 Violin', '42 Viola', '43 Cello', '44 Contrabass', '45 Tremolo Strings', '46 Pizzicato Strings', '47 Orchestral Harp', '48 Timpani'],
	'Ensemble': ['49 String Ensemble 1', '50 String Ensemble 2', '51 Synth Strings 1', '52 Synth Strings 2', '53 Choir Aahs', '54 Voice Oohs', '55 Synth Choir', '56 Orchestra Hit'],
	'Brass': ['57 Trumpet', '58 Trombone', '59 Tuba', '60 Muted Trumpet', '61 French Horn', '62 Brass Section', '63 Synth Brass 1', '64 Synth Brass 2'],
	'Reed': ['65 Soprano Sax', '66 Alto Sax', '67 Tenor Sax', '68 Baritone Sax', '69 Oboe', '70 English Horn', '71 Bassoon', '72 Clarinet'],
	'Pipe': ['73 Piccolo', '74 Flute', '75 Recorder', '76 Pan Flute', '77 Blown Bottle', '78 Shakuhachi', '79 Whistle', '80 Ocarina'],
	'Synth Lead': ['81 Lead 1 (square)', '82 Lead 2 (sawtooth)', '83 Lead 3 (calliope)', '84 Lead 4 (chiff)', '85 Lead 5 (charang)', '86 Lead 6 (voice)', '87 Lead 7 (fifths)', '88 Lead 8 (bass + lead)'],
	'Synth Pad': ['89 Pad 1 (new age)', '90 Pad 2 (warm)', '91 Pad 3 (polysynth)', '92 Pad 4 (choir)', '93 Pad 5 (bowed)', '94 Pad 6 (metallic)', '95 Pad 7 (halo)', '96 Pad 8 (sweep)'],
	'Synth Effects': ['97 FX 1 (rain)', '98 FX 2 (soundtrack)', '99 FX 3 (crystal)', '100 FX 4 (atmosphere)', '101 FX 5 (brightness)', '102 FX 6 (goblins)', '103 FX 7 (echoes)', '104 FX 8 (sci-fi)'],
	'Ethnic': ['105 Sitar', '106 Banjo', '107 Shamisen', '108 Koto', '109 Kalimba', '110 Bagpipe', '111 Fiddle', '112 Shanai'],
	'Percussive': ['113 Tinkle Bell', '114 Agogo', '115 Steel Drums', '116 Woodblock', '117 Taiko Drum', '118 Melodic Tom', '119 Synth Drum'],
	'Sound effects': ['120 Reverse Cymbal', '121 Guitar Fret Noise', '122 Breath Noise', '123 Seashore', '124 Bird Tweet', '125 Telephone Ring', '126 Helicopter', '127 Applause', '128 Gunshot']
});

// channel-tracker
MIDI.channels = (function () { // 0 - 15 channels
	var channels = {};
	for (var n = 0; n < 16; n++) {
		channels[n] = { // default values
			instrument: 0,
			// Acoustic Grand Piano
			mute: false,
			mono: false,
			omni: false,
			solo: false
		};
	}
	return channels;
})();

//
MIDI.pianoKeyOffset = 21;

// note conversions
MIDI.keyToNote = {}; // C8  == 108
MIDI.noteToKey = {}; // 108 ==  C8
(function () {
	var A0 = 0x15; // first note
	var C8 = 0x6C; // last note
	var number2key = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
	for (var n = A0; n <= C8; n++) {
		var octave = (n - 12) / 12 >> 0;
		var name = number2key[n % 12] + octave;
		MIDI.keyToNote[name] = n;
		MIDI.noteToKey[n] = name;
	}
})();

})();