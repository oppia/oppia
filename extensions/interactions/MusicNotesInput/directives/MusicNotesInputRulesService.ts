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
 * @fileoverview Rules service for the interaction.
 */

// The below file is imported just for its constant.
require(
  'interactions/MusicNotesInput/directives/' +
  'OppiaInteractiveMusicNotesInputDirective.ts');

require('interactions/interactions-extension.constants.ajs.ts');

angular.module('oppia').factory('MusicNotesInputRulesService', [
  'NOTE_NAMES_TO_MIDI_VALUES', function(NOTE_NAMES_TO_MIDI_VALUES) {
    var _getMidiNoteValue = function(note) {
      if (NOTE_NAMES_TO_MIDI_VALUES.hasOwnProperty(note.readableNoteName)) {
        return NOTE_NAMES_TO_MIDI_VALUES[note.readableNoteName];
      } else {
        throw new Error('Invalid music note ' + note);
      }
    };

    var _convertSequenceToMidi = function(sequence) {
      return sequence.map(function(note) {
        return _getMidiNoteValue(note);
      });
    };

    return {
      Equals: function(answer, inputs) {
        return angular.equals(_convertSequenceToMidi(answer),
          _convertSequenceToMidi(inputs.x));
      },
      IsLongerThan: function(answer, inputs) {
        return _convertSequenceToMidi(answer).length > inputs.k;
      },
      // TODO(wxy): validate that inputs.a <= inputs.b
      HasLengthInclusivelyBetween: function(answer, inputs) {
        var answerLength = _convertSequenceToMidi(answer).length;
        return answerLength >= inputs.a && answerLength <= inputs.b;
      },
      IsEqualToExceptFor: function(answer, inputs) {
        var targetSequence = _convertSequenceToMidi(inputs.x);
        var userSequence = _convertSequenceToMidi(answer);
        if (userSequence.length !== targetSequence.length) {
          return false;
        }

        var numWrongNotes = 0;
        userSequence.map(function(noteValue, index) {
          if (noteValue !== targetSequence[index]) {
            numWrongNotes++;
          }
        });
        return numWrongNotes <= inputs.k;
      },
      IsTranspositionOf: function(answer, inputs) {
        var targetSequence = _convertSequenceToMidi(inputs.x);
        var userSequence = _convertSequenceToMidi(answer);
        if (userSequence.length !== targetSequence.length) {
          return false;
        }
        return userSequence.every(function(noteValue, index) {
          return targetSequence[index] + inputs.y === noteValue;
        });
      },
      IsTranspositionOfExceptFor: function(answer, inputs) {
        var targetSequence = _convertSequenceToMidi(inputs.x);
        var userSequence = _convertSequenceToMidi(answer);
        if (userSequence.length !== targetSequence.length) {
          return false;
        }

        var numWrongNotes = 0;
        userSequence.map(function(noteValue, index) {
          if (targetSequence[index] + inputs.y !== noteValue) {
            numWrongNotes++;
          }
        });
        return numWrongNotes <= inputs.k;
      }
    };
  }]);
