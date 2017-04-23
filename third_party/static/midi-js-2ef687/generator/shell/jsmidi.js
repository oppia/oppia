/* 
	JSMIDI
	------------------------------------
	https://github.com/sergi/jsmidi
	------------------------------------
	This material is licensed by Sergi Mansilla under the Creative Commons Attribution-ShareAlike 3.0 license. 
	You are free to copy, distribute, transmit, and remix this work, provided you attribute the work to Sergi Mansilla 
	as the original author and reference this repository. If you alter, transform, or build upon this work, 
	you may distribute the resulting work only under the same, similar or compatible license. Any of the above 
	conditions can be waived if you get permission from the copyright holder. For any reuse or distribution, 
	you must make clear to others the license terms of this work. The best way to do this is with a link to the 
	Creative Commons Attribution-Share Alike 3.0.
*/

(function (window) {

var AP = Array.prototype;

// Create a mock console object to void undefined errors if the console object
// is not defined.
if (!window.console || !console.firebug) {
    var names = ["log", "debug", "info", "warn", "error"];

    window.console = {};
    for (var i = 0; i < names.length; ++i) {
        window.console[names[i]] = function() {};
    }
}

var DEFAULT_VOLUME   = 90;
var DEFAULT_DURATION = 128;
var DEFAULT_CHANNEL  = 0;

// These are the different values that compose a MID header. They are already
// expressed in their string form, so no useless conversion has to take place
// since they are constants.

var HDR_CHUNKID     = "MThd";
var HDR_CHUNK_SIZE  = "\x00\x00\x00\x06"; // Header size for SMF
var HDR_TYPE0       = "\x00\x00"; // Midi Type 0 id
var HDR_TYPE1       = "\x00\x01"; // Midi Type 1 id
var HDR_SPEED       = "\x00\x80"; // Defaults to 128 ticks per beat

// Midi event codes
var EVT_NOTE_OFF           = 0x8;
var EVT_NOTE_ON            = 0x9;
var EVT_AFTER_TOUCH        = 0xA;
var EVT_CONTROLLER         = 0xB;
var EVT_PROGRAM_CHANGE     = 0xC;
var EVT_CHANNEL_AFTERTOUCH = 0xD;
var EVT_PITCH_BEND         = 0xE;

var META_SEQUENCE   = 0x00;
var META_TEXT       = 0x01;
var META_COPYRIGHT  = 0x02;
var META_TRACK_NAME = 0x03;
var META_INSTRUMENT = 0x04;
var META_LYRIC      = 0x05;
var META_MARKER     = 0x06;
var META_CUE_POINT  = 0x07;
var META_CHANNEL_PREFIX = 0x20;
var META_END_OF_TRACK   = 0x2f;
var META_TEMPO      = 0x51;
var META_SMPTE      = 0x54;
var META_TIME_SIG   = 0x58;
var META_KEY_SIG    = 0x59;
var META_SEQ_EVENT  = 0x7f;

// This is the conversion table from notes to its MIDI number. Provided for
// convenience, it is not used in this code.
var noteTable = { "G9": 0x7F, "Gb9": 0x7E, "F9": 0x7D, "E9": 0x7C, "Eb9": 0x7B,
"D9": 0x7A, "Db9": 0x79, "C9": 0x78, "B8": 0x77, "Bb8": 0x76, "A8": 0x75, "Ab8": 0x74,
"G8": 0x73, "Gb8": 0x72, "F8": 0x71, "E8": 0x70, "Eb8": 0x6F, "D8": 0x6E, "Db8": 0x6D,
"C8": 0x6C, "B7": 0x6B, "Bb7": 0x6A, "A7": 0x69, "Ab7": 0x68, "G7": 0x67, "Gb7": 0x66,
"F7": 0x65, "E7": 0x64, "Eb7": 0x63, "D7": 0x62, "Db7": 0x61, "C7": 0x60, "B6": 0x5F,
"Bb6": 0x5E, "A6": 0x5D, "Ab6": 0x5C, "G6": 0x5B, "Gb6": 0x5A, "F6": 0x59, "E6": 0x58,
"Eb6": 0x57, "D6": 0x56, "Db6": 0x55, "C6": 0x54, "B5": 0x53, "Bb5": 0x52, "A5": 0x51,
"Ab5": 0x50, "G5": 0x4F, "Gb5": 0x4E, "F5": 0x4D, "E5": 0x4C, "Eb5": 0x4B, "D5": 0x4A,
"Db5": 0x49, "C5": 0x48, "B4": 0x47, "Bb4": 0x46, "A4": 0x45, "Ab4": 0x44, "G4": 0x43,
"Gb4": 0x42, "F4": 0x41, "E4": 0x40, "Eb4": 0x3F, "D4": 0x3E, "Db4": 0x3D, "C4": 0x3C,
"B3": 0x3B, "Bb3": 0x3A, "A3": 0x39, "Ab3": 0x38, "G3": 0x37, "Gb3": 0x36, "F3": 0x35,
"E3": 0x34, "Eb3": 0x33, "D3": 0x32, "Db3": 0x31, "C3": 0x30, "B2": 0x2F, "Bb2": 0x2E,
"A2": 0x2D, "Ab2": 0x2C, "G2": 0x2B, "Gb2": 0x2A, "F2": 0x29, "E2": 0x28, "Eb2": 0x27,
"D2": 0x26, "Db2": 0x25, "C2": 0x24, "B1": 0x23, "Bb1": 0x22, "A1": 0x21, "Ab1": 0x20,
"G1": 0x1F, "Gb1": 0x1E, "F1": 0x1D, "E1": 0x1C, "Eb1": 0x1B, "D1": 0x1A, "Db1": 0x19,
"C1": 0x18, "B0": 0x17, "Bb0": 0x16, "A0": 0x15, "Ab0": 0x14, "G0": 0x13, "Gb0": 0x12,
"F0": 0x11, "E0": 0x10, "Eb0": 0x0F, "D0": 0x0E, "Db0": 0x0D, "C0": 0x0C };

// Helper functions

/*
 * Converts a string into an array of ASCII char codes for every character of
 * the string.
 *
 * @param str {String} String to be converted
 * @returns array with the charcode values of the string
 */
function StringToNumArray(str) {
    return AP.map.call(str, function(char) {
        return char.charCodeAt(0);
    });
}

/*
 * Converts an array of bytes to a string of hexadecimal characters. Prepares
 * it to be converted into a base64 string.
 *
 * @param byteArray {Array} array of bytes that will be converted to a string
 * @returns hexadecimal string
 */
function codes2Str(byteArray) {
    return String.fromCharCode.apply(null, byteArray);
}

/*
 * Converts a String of hexadecimal values to an array of bytes. It can also
 * add remaining "0" nibbles in order to have enough bytes in the array as the
 * |finalBytes| parameter.
 *
 * @param str {String} string of hexadecimal values e.g. "097B8A"
 * @param finalBytes {Integer} Optional. The desired number of bytes that the returned array should contain
 * @returns array of nibbles.
 */

function str2Bytes(str, finalBytes) {
    if (finalBytes) {
        while ((str.length / 2) < finalBytes) { str = "0" + str; }
    }

    var bytes = [];
    for (var i=str.length-1; i>=0; i = i-2) {
        var chars = i === 0 ? str[i] : str[i-1] + str[i];
        bytes.unshift(parseInt(chars, 16));
    }

    return bytes;
}

function isArray(obj) {
    return !!(obj && obj.concat && obj.unshift && !obj.callee);
}


/**
 * Translates number of ticks to MIDI timestamp format, returning an array of
 * bytes with the time values. Midi has a very particular time to express time,
 * take a good look at the spec before ever touching this function.
 *
 * @param ticks {Integer} Number of ticks to be translated
 * @returns Array of bytes that form the MIDI time value
 */
var translateTickTime = function(ticks) {
    var buffer = ticks & 0x7F;

    while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ((ticks & 0x7F) | 0x80);
    }

    var bList = [];
    while (true) {
        bList.push(buffer & 0xff);

        if (buffer & 0x80) { buffer >>= 8; }
        else { break; }
    }
    return bList;
};

/*
 * This is the function that assembles the MIDI file. It writes the
 * necessary constants for the MIDI header and goes through all the tracks, appending
 * their data to the final MIDI stream.
 * It returns an object with the final values in hex and in base64, and with
 * some useful methods to play an manipulate the resulting MIDI stream.
 *
 * @param config {Object} Configuration object. It contains the tracks, tempo
 * and other values necessary to generate the MIDI stream.
 *
 * @returns An object with the hex and base64 resulting streams, as well as
 * with some useful methods.
 */
var MidiWriter = function(config) {
    if (config) {
        var tracks  = config.tracks || [];
        // Number of tracks in hexadecimal
        var tracksLength = tracks.length.toString(16);

        // This variable will hold the whole midi stream and we will add every
        // chunk of MIDI data to it in the next lines.
        var hexMidi = HDR_CHUNKID + HDR_CHUNK_SIZE + HDR_TYPE0;

        // Appends the number of tracks expressed in 2 bytes, as the MIDI
        // standard requires.
        hexMidi += codes2Str(str2Bytes(tracksLength, 2));
        hexMidi += HDR_SPEED;
        // Goes through the tracks appending the hex strings that compose them.
        tracks.forEach(function(trk) { hexMidi += codes2Str(trk.toBytes()); });

        return {
            b64: btoa(hexMidi),
            play: function() {
                if (document) {
                    var embed = document.createElement("embed");
                    embed.setAttribute("src", "data:audio/midi;base64," + this.b64);
                    embed.setAttribute("type", "audio/midi");
                    document.body.appendChild(embed);
                }
            },
            save: function() {
                window.open("data:audio/midi;base64," + this.b64,
                            "JSMidi generated output",
                            "resizable=yes,scrollbars=no,status=no");
            }
        };

    } else {
        throw new Error("No parameters have been passed to MidiWriter.");
    }
};

/*
 * Generic MidiEvent object. This object is used to create standard MIDI events
 * (note Meta events nor SysEx events). It is passed a |params| object that may
 * contain the keys time, type, channel, param1 and param2. Note that only the
 * type, channel and param1 are strictly required. If the time is not provided,
 * a time of 0 will be assumed.
 *
 * @param {object} params Object containing the properties of the event.
 */
var MidiEvent = function(params) {
    if (params &&
        (params.type    !== null || params.type    !== undefined) &&
        (params.channel !== null || params.channel !== undefined) &&
        (params.param1  !== null || params.param1  !== undefined)) {
        this.setTime(params.time);
        this.setType(params.type);
        this.setChannel(params.channel);
        this.setParam1(params.param1);
        this.setParam2(params.param2);
    } else {
        throw new Error("Not enough parameters to create an event.");
    }
};


/**
 * Returns the list of events that form a note in MIDI. If the |sustained|
 * parameter is not specified, it creates the noteOff event, which stops the
 * note after it has been played, instead of keeping it playing.
 *
 * This method accepts two ways of expressing notes. The first one is a string,
 * which will be looked up in the global |noteTable| but it will take the
 * default values for pitch, channel, durtion and volume.
 *
 * If a note object is passed to the method instead, it should contain the properties
 * channel, pitch, duration and volume, of which pitch is mandatory. In case the
 * channel, the duration or the volume are not passed, default values will be
 * used.
 *
 * @param note {object || String} Object with note properties or string
 * @param sustained {Boolean} Whether the note has to end or keep playing
 * @returns Array of events, with a maximum of two events (noteOn and noteOff)
 */

MidiEvent.createNote = function(note, sustained) {
    if (!note) { throw new Error("Note not specified"); }

    if (typeof note === "string") {
        note = noteTable[note];
    // The pitch is mandatory if the note object is used.
    } else if (!note.pitch) {
        throw new Error("The pitch is required in order to create a note.");
    }
    var events = [];
    events.push(MidiEvent.noteOn(note));

    // If there is a |sustained| parameter, the note will keep playing until
    // a noteOff event is issued for it.
    if (!sustained) {
        // The noteOff event will be the one that is passed the actual duration
        // value for the note, since it is the one that will stop playing the
        // note at a particular time. If not specified it takes the default
        // value for it.
        // TODO: Is is good to have a default value for it?
        events.push(MidiEvent.noteOff(note, note.duration || DEFAULT_DURATION));
    }

    return events;
};

/**
 * Returns an event of the type NOTE_ON taking the values passed and falling
 * back to defaults if they are not specified.
 *
 * @param note {Note || String} Note object or string
 * @param time {Number} Duration of the note in ticks
 * @returns MIDI event with type NOTE_ON for the note specified
 */
MidiEvent.noteOn = function(note, duration) {
    return new MidiEvent({
        time:    note.duration || duration || 0,
        type:    EVT_NOTE_ON,
        channel: note.channel || DEFAULT_CHANNEL,
        param1:  note.pitch   || note,
        param2:  note.volume  || DEFAULT_VOLUME
    });
};

/**
 * Returns an event of the type NOTE_OFF taking the values passed and falling
 * back to defaults if they are not specified.
 *
 * @param note {Note || String} Note object or string
 * @param time {Number} Duration of the note in ticks
 * @returns MIDI event with type NOTE_OFF for the note specified
 */

MidiEvent.noteOff = function(note, duration) {
    return new MidiEvent({
        time:    note.duration || duration || 0,
        type:    EVT_NOTE_OFF,
        channel: note.channel || DEFAULT_CHANNEL,
        param1:  note.pitch   || note,
        param2:  note.volume  || DEFAULT_VOLUME
    });
};


MidiEvent.prototype = {
    type: 0,
    channel: 0,
    time: 0,
    setTime: function(ticks) {
        // The 0x00 byte is always the last one. This is how Midi
        // interpreters know that the time measure specification ends and the
        // rest of the event signature starts.

        this.time = translateTickTime(ticks || 0);
    },
    setType: function(type) {
        if (type < EVT_NOTE_OFF || type > EVT_PITCH_BEND) {
            throw new Error("Trying to set an unknown event: " + type);
        }

        this.type = type;
    },
    setChannel: function(channel) {
        if (channel < 0 || channel > 15) {
            throw new Error("Channel is out of bounds.");
        }

        this.channel = channel;
    },
    setParam1: function(p) {
        this.param1 = p;
    },
    setParam2: function(p) {
        this.param2 = p;
    },
    toBytes: function() {
        var byteArray = [];

        var typeChannelByte =
            parseInt(this.type.toString(16) + this.channel.toString(16), 16);

        byteArray.push.apply(byteArray, this.time);
        byteArray.push(typeChannelByte);
        byteArray.push(this.param1);

        // Some events don't have a second parameter
        if (this.param2 !== undefined && this.param2 !== null) {
            byteArray.push(this.param2);
        }
        return byteArray;
    }
};

var MetaEvent = function(params) {
    if (params) {
        this.setType(params.type);
        this.setData(params.data);
    }
};

MetaEvent.prototype = {
    setType: function(t) {
        this.type = t;
    },
    setData: function(d) {
        this.data = d;
    },
    toBytes: function() {
        if (!this.type || !this.data) {
            throw new Error("Type or data for meta-event not specified.");
        }

        var byteArray = [0xff, this.type];

        // If data is an array, we assume that it contains several bytes. We
        // apend them to byteArray.
        if (isArray(this.data)) {
            AP.push.apply(byteArray, this.data);
        }

        return byteArray;
    }
};

var MidiTrack = function(cfg) {
    this.events = [];
    for (var p in cfg) {
        if (cfg.hasOwnProperty(p)) {
            // Get the setter for the property. The property is capitalized.
            // Probably a try/catch should go here.
            this["set" + p.charAt(0).toUpperCase() + p.substring(1)](cfg[p]);
        }
    }
};

//"MTrk" Marks the start of the track data
MidiTrack.TRACK_START = [0x4d, 0x54, 0x72, 0x6b];
MidiTrack.TRACK_END   = [0x0, 0xFF, 0x2F, 0x0];

MidiTrack.prototype = {
    /*
     * Adds an event to the track.
     *
     * @param event {MidiEvent} Event to add to the track
     * @returns the track where the event has been added
     */
    addEvent: function(event) {
        this.events.push(event);
        return this;
    },
    setEvents: function(events) {
        AP.push.apply(this.events, events);
        return this;
    },
    /*
     * Adds a text meta-event to the track.
     *
     * @param type {Number} type of the text meta-event
     * @param text {String} Optional. Text of the meta-event.
     * @returns the track where the event ahs been added
     */
    setText: function(type, text) {
        // If the param text is not specified, it is assumed that a generic
        // text is wanted and that the type parameter is the actual text to be
        // used.
        if (!text) {
            type = META_TEXT;
            text = type;
        }
        return this.addEvent(new MetaEvent({ type: type, data: text }));
    },
    // The following are setters for different kinds of text in MIDI, they all
    // use the |setText| method as a proxy.
    setCopyright:  function(text) { return this.setText(META_COPYRIGHT, text);  },
    setTrackName:  function(text) { return this.setText(META_TRACK_NAME, text); },
    setInstrument: function(text) { return this.setText(META_INSTRUMENT, text); },
    setLyric:      function(text) { return this.setText(META_LYRIC, text);      },
    setMarker:     function(text) { return this.setText(META_MARKER, text);     },
    setCuePoint:   function(text) { return this.setText(META_CUE_POINT, text);  },

    setTempo: function(tempo) {
        this.addEvent(new MetaEvent({ type: META_TEMPO, data: tempo }));
    },
    setTimeSig: function() {
        // TBD
    },
    setKeySig: function() {
        // TBD
    },

    toBytes: function() {
        var trackLength = 0;
        var eventBytes = [];
        var startBytes = MidiTrack.TRACK_START;
        var endBytes   = MidiTrack.TRACK_END;

        /*
         * Adds the bytes of an event to the eventBytes array and add the
         * amount of bytes to |trackLength|.
         *
         * @param event {MidiEvent} MIDI event we want the bytes from.
         */
        var addEventBytes = function(event) {
            var bytes = event.toBytes();
            trackLength += bytes.length;
            AP.push.apply(eventBytes, bytes);
        };

        this.events.forEach(addEventBytes);

        // Add the end-of-track bytes to the sum of bytes for the track, since
        // they are counted (unlike the start-of-track ones).
        trackLength += endBytes.length;

        // Makes sure that track length will fill up 4 bytes with 0s in case
        // the length is less than that (the usual case).
        var lengthBytes = str2Bytes(trackLength.toString(16), 4);

        return startBytes.concat(lengthBytes, eventBytes, endBytes);
    }
};

window.MidiWriter = MidiWriter;
window.MidiEvent = MidiEvent;
window.MetaEvent = MetaEvent;
window.MidiTrack = MidiTrack;
window.noteTable = noteTable;

})(window);