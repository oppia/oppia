// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Player service for the interaction.
 */

oppia.factory('MusicPhrasePlayerService', ['$timeout', function($timeout) {
  var _MIDI_CHANNEL = 0;
  var _MIDI_VELOCITY = 127;
  var _SECS_TO_MILLISECS = 1000.0;

  var _playNote = function(midiValues, durationInSecs, delayInSecs) {
    $timeout(function() {
      MIDI.chordOn(
        _MIDI_CHANNEL, midiValues, _MIDI_VELOCITY, 0);
      MIDI.chordOff(
        _MIDI_CHANNEL, midiValues, durationInSecs);
    }, delayInSecs * _SECS_TO_MILLISECS);
  };

  /**
   * Plays a music phrase. The input is given as an Array of notes. Each
   * note is represented as an object with three key-value pairs:
   * - midiValue: Integer. The midi value of the note.
   * - duration: Float. A decimal number representing the length of the note, in
   *     seconds.
   * - start: Float. A decimal number representing the time offset (after the
   *     beginning of the phrase) at which to start playing the note.
   */
  var _playMusicPhrase = function(notes) {
    MIDI.Player.stop();

    for (var i = 0; i < notes.length; i++) {
      _playNote([notes[i].midiValue], notes[i].duration, notes[i].start);
    }
  };

  return {
    playMusicPhrase: function(notes) {
      _playMusicPhrase(notes);
    }
  };
}]);
