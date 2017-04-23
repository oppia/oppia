CODE EXAMPLES (from the repo)

* ./demo-Basic.html - the most basic implementation.
* ./demo-MIDIPlayer.html - how to parse MIDI files, and interact with the data stream.
* ./demo-MultipleInstruments.html - synth drum and piano playing together
* ./demo-WhitneyMusicBox.html - a audio/visual experiment by Jim Bumgardner

-------------

SOUND FONTS

* <a href="https://github.com/SHMEDIALIMITED/SoundFontJS">NodeJS CLI for MIDI.js sound font creation</a>
* <a href="https://github.com/gleitz/midi-js-soundfonts">Pre-rendered sound fonts</a>

DEMOS

* <a href="http://mudcu.be/piano/">Color Piano</a> by Michael Deal @mudcube
* <a href="http://www.rgba.org/r3d/3d-piano-player/">3D Piano Player w/ Three.js</a> by Borja Morales @reality3d
* <a href="http://labs.uxmonk.com/simon-says/">Simon Says</a> by Daniel Christopher @uxmonk
* <a href="http://labs.uxmonk.com/brite-lite/">Brite Lite</a> by Daniel Christopher @uxmonk
* <a href="http://qiao.github.com/euphony/">Euphony 3D Piano</a> by Xueqiao Xu @qiao
* <a href="http://my.vexflow.com/articles/53">VexFlow</a> by Mohit Muthanna @11111110b
* <a href="http://spiral.qet.me/">Spiral Keyboard</a> by Patrick Snels
* <a href="http://online-compute.rhcloud.com/ragamroll/">Ragamroll</a> by Mani Balasubramanian
* <a href="http://gbloink.com/alpha/">Gbloink!</a> by Phil Jones

-------------

* <a href="./js/MIDI/LoadPlugin.js">MIDI.loadPlugin.js</a>: Decides which framework is best to use, and sends request.

<pre>
// interface to download soundfont, then execute callback;
MIDI.loadPlugin(callback);
// simple example to get started;
MIDI.loadPlugin({
    instrument: "acoustic_grand_piano", // or the instrument code 1 (aka the default)
    instruments: [ "acoustic_grand_piano", "acoustic_guitar_nylon" ], // or multiple instruments
    callback: function() { }
});
</pre>

* <a href="./js/MIDI/Plugin.js">MIDI.Plugin.js</a>: Ties together the following frameworks;

<pre>
MIDI.noteOn(channel, note, velocity, delay);
MIDI.noteOff(channel, note, delay);
MIDI.chordOn(channel, [note, note, note], velocity, delay);
MIDI.chordOff(channel, [note, note, note], delay);
MIDI.keyToNote = object; // A0 => 21
MIDI.noteToKey = object; // 21 => A0
</pre>

* <a href="./js/MIDI/Player.js">MIDI.Player.js</a>: Streams the MIDI to the browser.

<pre>
MIDI.Player.currentTime = integer; // time we are at now within the song.
MIDI.Player.endTime = integer; // time when song ends.
MIDI.Player.playing = boolean; // are we playing? yes or no.
MIDI.Player.loadFile(file, callback); // load .MIDI from base64 or binary XML request.
MIDI.Player.start(); // start the MIDI track (you can put this in the loadFile callback)
MIDI.Player.resume(); // resume the MIDI track from pause.
MIDI.Player.pause(); // pause the MIDI track.
MIDI.Player.stop(); // stops all audio being played, and resets currentTime to 0.

// <b>Callback whenever a note is played;</b>
MIDI.Player.removeListener(); // removes current listener.
MIDI.Player.addListener(function(data) { // set it to your own function!
    var now = data.now; // where we are now
    var end = data.end; // time when song ends
    var channel = data.channel; // channel note is playing on
    var message = data.message; // 128 is noteOff, 144 is noteOn
    var note = data.note; // the note
    var velocity = data.velocity; // the velocity of the note
    // then do whatever you want with the information!
});

// <b>Smooth animation, interpolates between onMidiEvent calls;</b>
MIDI.Player.clearAnimation(); // clears current animation.
MIDI.Player.setAnimation(function(data) {
    var now = data.now; // where we are now
    var end = data.end; // time when song ends
    var events = data.events; // all the notes currently being processed
    // then do what you want with the information!
});</pre>

* <a href="./js/Color/SpaceW3.js">Color.js</a>: Color conversions, music isn&rsquo;t complete without!
<pre>Color.Space(0xff0000, "HEX>RGB>HSL");</pre>
* <a href="./js/Window/DOMLoader.script.js">DOMLoader.script.js</a>: Loads scripts in synchronously, or asynchronously.
<pre>DOMLoader.script.add(src, callback);</pre>
* <a href="./js/Window/DOMLoader.XMLHttp.js">DOMLoader.XMLHttp.js</a>: Cross-browser XMLHttpd request.
<pre>DOMLoader.sendRequest(src, callback);</pre>
* <a href="./js/MusicTheory/Synesthesia.js">MusicTheory.Synesthesia.js</a>: Note-to-color mappings (from Isaac Newton onwards).
 <h3>Many thanks to the authors of these libraries;</h3>
* <a href="http://webaudio.github.io/web-midi-api/">Web MIDI API</a>: W3C proposal by Jussi Kalliokoski & Chris Wilson
* <a href="https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html">Web Audio API</a>: W3C proposal by Chris Rogers
* <a href="http://dev.w3.org/html5/spec/Overview.html">&lt;audio&gt;</a>: HTML5 specs
* Flash package: <a href="http://www.schillmania.com/projects/soundmanager2/">SoundManager2</a> by <a href="http://schillmania.com">Scott Schiller</a>
* <a href="https://github.com/gasman/jasmid">jasmid</a>: Reads MIDI file byte-code, and translats into a Javascript array.
* <a href="http://blog.danguer.com/2011/10/24/base64-binary-decoding-in-javascript/">base642binary.js</a>: Cleans up XML base64-requests for Web Audio API.
