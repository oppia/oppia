require('static/midi-js-a8a842/build/MIDI.js');
require('static/midi-js-a8a842/inc/shim/Base64binary.js');
$(document).ready(function () {
  MIDI.loadPlugin({
    soundfontUrl: '/third_party/static/midi-js-a8a842/examples/soundfont/',
    instrument: 'acoustic_grand_piano',
    callback: function () { }
  });
});
