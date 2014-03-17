// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * Directive for the MusicNotesInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveMusicNotesInput', [
  'oppiaHtmlEscaper', '$compile', function(oppiaHtmlEscaper, $compile) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/MusicNotesInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.SOUNDFONT_URL = '/third_party/static/midi-js-09335a/soundfont/';
        $scope.sequenceToGuess = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.sequenceToGuessWithValue);

        // Array to hold the notes placed on staff. Notes are represented as objects
        // with two keys: baseNoteMidiNumber and offset. The baseNoteMidiNumber is 
        // an integer value denoting the MIDI number of the staff-line the note is on,
        // and the offset is either -1, 0 or 1, denoting a flat, natural or 
        // sharp respectively.
        var noteSequence = [];

        // Counter to create unique id for each note dropped on staff.
        $scope._currentNoteId = 0;
        $scope.generateNoteId = function() {
          $scope._currentNoteId += 1;
          return 'note_id_' + ($scope._currentNoteId - 1);
        };

        var NOTE_TYPE_NATURAL = 0;
        var NOTE_TYPE_FLAT = -1;
        var NOTE_TYPE_SHARP = 1;
        // TODO More notes types will be added to NOTE_TYPES.
        var NOTE_TYPES = [NOTE_TYPE_NATURAL];

        // Gives the staff-lines human readable values.
        var NOTE_NAMES_TO_MIDI_VALUES = {
          'A5': 81,
          'G5': 79,
          'F5': 77,
          'E5': 76,
          'D5': 74,
          'C5': 72,
          'B4': 71,
          'A4': 69,
          'G4': 67,
          'F4': 65,
          'E4': 64,
          'D4': 62,
          'C4': 60
        };

        // Note position represents a given note's index + 1 in a sequence. 
        // This is mapped to a noteStart Object which is a more accurate 
        // representation of a given note's placement in a MusicPhrase.
        var NOTE_POSITION_TO_NOTE_START = {
          1: {'num': 1, 'den': 1},
          2: {'num': 2, 'den': 1},
          3: {'num': 3, 'den': 1},
          4: {'num': 4, 'den': 1},
          5: {'num': 5, 'den': 1},
          6: {'num': 6, 'den': 1},
          7: {'num': 7, 'den': 1},
          8: {'num': 8, 'den': 1}
        };

        var horizontalGridPositions = {};
        var verticalGridPositions = {};

        var verticalGridKeys = [
          81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60
        ];

        var horizontalGridKeys = [1, 2, 3, 4, 5, 6, 7, 8];

        var MAXIMUM_NOTES_POSSIBLE = 8;

        // Sets grid positions and initializes widget after staff has loaded.
        $(document).ready(function() {
          setTimeout(function() {
            horizontalGridPositions = updateHorizontalGridPositions();
            verticalGridPositions = updateVerticalGridPositions();
            $scope.init();
          }, 300);
        });

        // When page is resized, all notes are removed from sequence and staff
        // and then repainted in their new corresponding positions. 
        $(window).resize(function() {
          $scope.init();
        });

        // Creates draggable notes and droppable staff.
        $scope.init = function init() {
          containerWidth = getContainerWidth();
          containerHeight = computeContainerHeight(containerWidth);
          staffTop = computeStaffTop(containerHeight);
          staffBottom = computeStaffBottom(containerHeight);
          horizontalGridSpacing = computeHorizontalGridSpacing(containerWidth);

          RIGHT_EDGE_OF_STAFF_POSITION = $('.oppia-music-input-valid-note-area').width();
          NOTE_OFFSET = $('.oppia-music-input-natural-note').width() / 5;

          clearPalette();
          initPalette();
          
          clearDroppableStaff();
          buildDroppableStaff();

          horizontalGridPositions = updateHorizontalGridPositions();
          verticalGridPositions = updateVerticalGridPositions();

          repaintNotes();
        };

        $scope.init();

        function initPalette() {
          // Creates the notes and helper-clone notes for the noteChoices div.

          for (var i = 0; i < NOTE_TYPES.length; i++) {
            $('<div></div>')
            .data('noteType', NOTE_TYPES[i])
            .addClass(function () {
              if ($(this).data('noteType') === NOTE_TYPE_NATURAL) {
                $(this).addClass('oppia-music-input-natural-note');
              } else if ($(this).data('noteType') === NOTE_TYPE_FLAT) {
                $(this).addClass('oppia-music-input-flat-note ' +
                                 'oppia-music-input-notes-with-accidentals');
              } else if ($(this).data('noteType') === NOTE_TYPE_SHARP) {
                $(this).addClass('oppia-music-input-sharp-note ' +
                                 'oppia-music-input-notes-with-accidentals');
              }
            })
            .appendTo('.oppia-music-input-note-choices')
            .draggable({
              // Keeps note from being placed on top of the clef.
              containment: '.oppia-music-input-valid-note-area',
              cursor: 'pointer',
              helper: 'clone',
              stack: '.oppia-music-input-note-choices div',
              grid: [horizontalGridSpacing, 1],
              stop: function(event, ui) {
                if (!noteIsOffStaff($(ui.helper))) {
                  // This makes the helper clone a new draggable note.
                  var helperClone = $(ui.helper)
                  // Retains original note type (e.g. natural, flat, sharp).
                  .data('noteType', $(this).data('noteType'))
                  // noteId is undefined until it drops.
                  // This is used to prevent the stacking of notes on drop.
                  .data('noteId', undefined)
                  .draggable({
                    // The startLeftPos helps with the sorting of user sequence.
                    start: function(event, ui) {
                      $(this).data('startLeftPos', $(this).position().left);
                    },
                    containment: '.oppia-music-input-valid-note-area',
                    cursor: 'pointer',
                    grid: [horizontalGridSpacing, 1],
                    // Stops helper clone from being cloned again.
                    helper: 'original',
                    stack: '.oppia-music-input-note-choices div',
                    tolerance: 'pointer',
                    revert: function() {
                      // If note is out of droppable or off staff, remove it.
                      if (noteIsOffStaff($(this)) ||
                          noteIsOutOfDroppable($(ui.helper))) {
                        revertNote($(ui.helper));
                        sortNoteSequence();
                        $(this).remove();
                      }
                    }
                  });
                }
              }
            });
          }
        }

        function repaintNotes() {
          updateVerticalGridPositions(
            $('.oppia-music-input-staff div:first-child').position().top);
          for (var i = 0; i < noteSequence.length; i++) {
            $('<div></div>')
            .data('noteType', NOTE_TYPE_NATURAL)
            .data('noteId', noteSequence[i].note.noteId)
            .addClass('oppia-music-input-natural-note')
            .addClass('oppia-music-input-on-staff')
            .appendTo('.oppia-music-input-note-choices')
            .draggable({
              // Keeps note from being placed on top of the clef.
              containment: '.oppia-music-input-valid-note-area',
              cursor: 'pointer',
              stack: '.oppia-music-input-note-choices div',
              grid: [horizontalGridSpacing, 1],
              revert: function(event, ui) {
                // If note is out of droppable or off staff, remove it.
                if (noteIsOffStaff($(this)) ||
                    noteIsOutOfDroppable($(this))) {
                  revertNote($(this));
                  sortNoteSequence();
                  $(this).remove();
                }
              }
            })
            // Position notes in relation to where they were before resize.
            .css({
              top:
                getVerticalPosition(noteSequence[i].note.baseNoteMidiNumber) - NOTE_OFFSET,
              left:
                getHorizontalPosition(noteSequence[i].note.noteStart['num'])
            });
            // Draws ledger lines.
            var lineValue =
              _getCorrespondingNoteName(noteSequence[i].note.baseNoteMidiNumber);
            if (isLedgerLineNote(lineValue)) {
              drawLedgerLine(
                getVerticalPosition(noteSequence[i].note.baseNoteMidiNumber),
                getHorizontalPosition(noteSequence[i].note.noteStart['num']),
                lineValue
              );
            }
          }
        }

        function buildDroppableStaff() {
          // Creates a staff of droppable lines.
          var lineValues = Object.keys(NOTE_NAMES_TO_MIDI_VALUES);
          for (var i = 0; i < lineValues.length; i++) {
            $('<div></div>')
            .data('line-value', lineValues[i])
            .appendTo('.oppia-music-input-staff')
            .droppable({
              accept: '.oppia-music-input-note-choices div',
              // Over and out are used to remove helper clone if 
              // note is not placed on staff.
              over: function(event, ui) {
                var lineValue = $(event.target).data('line-value');

                // Draws a ledger-line when note is hovering over staff-line.
                if (isLedgerLineNote(lineValue)) {
                  // Position of current dropped note.
                  var leftPos = ui.helper.position().left;
                  var topPos = $(event.target).position().top;
                  var noteType = ui.draggable.data('noteType');
                  drawLedgerLine(topPos, leftPos, lineValue);
                }
              },
              out: function(event, ui) {
                $('.oppia-music-input-ledger-line').last().hide();
              },
              hoverClass: 'oppia-music-input-hovered',
              // Handles note drops and appends new note to noteSequence.
              drop: function(event, ui) {
                // Makes helper clone not disappear when dropped on staff.
                $.ui.ddmanager.current.cancelHelperRemoval = true;

                $('.oppia-music-input-ledger-line').last().hide();
                // Previous position of note or undefined. 
                var startPos = $(ui.helper).data('startLeftPos');

                // Position of current dropped note.
                var leftPos = ui.helper.position().left;
                var topPos = $(event.target).position().top;

                // The staff line's value.
                var lineValue = $(this).data('line-value');
                var noteValue = ui.draggable.data('noteType');

                // This makes sure that a note can move vertically on it's position.
                if (startPos !== leftPos) {
                  // If new note doesn't exceed the maximum note's that can fit 
                  // on staff, then see if a position is available. Otherwise, 
                  // remove the note.
                  if (noteSequence.length + 1 <= MAXIMUM_NOTES_POSSIBLE) {

                    // Moves the note to the next available spot on the staff.
                    // If the staff is full, note is moved off staff, and thus removed.
                    while (checkIfNotePositionTaken(leftPos)) {
                      leftPos += horizontalGridSpacing;
                    }
                    $(ui.helper).css({top: topPos, left: leftPos});
                  } else {
                    $(ui.helper).remove();
                  }
                }
                  
                // Adjusts note so it is right on top of the staff line.
                $(ui.helper).css({top: topPos - NOTE_OFFSET});
               
                // A note that is dragged from noteChoices box
                // has an undefined noteId. This sets the id. 
                // Otherwise, the note has an id.
                var noteId = $(ui.helper).data('noteId');
                if ($(ui.helper).data('noteId') === undefined) {
                  noteId = $scope.generateNoteId();
                  $(ui.helper).data('noteId', noteId);
                } else {
                  noteId = $(ui.helper).data('noteId');
                }

                // Creates a note object.
                var note = {
                  baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[lineValue],
                  offset: parseInt(noteValue, 10),
                  noteId: noteId,
                  noteDuration: 4,
                  noteStart: setNoteStart(leftPos)
                };

                // Draws ledger lines when note is dropped.
                if (isLedgerLineNote(lineValue) && !noteIsOffStaff($(ui.helper))) {
                  drawLedgerLine(topPos, leftPos, lineValue);
                }

                if (noteIsOffStaff($(ui.helper))) {
                  removeNote(note);
                  $(ui.helper).remove();
                } else {
                  noteSequence.push({note: note});
                  removeNote(note);
                  sortNoteSequence();

                  // Sounds the note when it is dropped onto staff.
                  playChord([_convertNoteToMidiPitch(note)]);
                  $(ui.helper).addClass('oppia-music-input-on-staff');
                }
              }
            });
          }
        }

        // Gets horizontal grid positions based on the position of note-choices div.
        function updateHorizontalGridPositions() {
          var horizontalGridPositions = {};
          var leftPosition =
            $('.oppia-music-input-note-choices div:first-child').position().left;
          for (var i = horizontalGridKeys.length; i >= 1; i--) {
            horizontalGridPositions[i] = leftPosition;
            leftPosition -= horizontalGridSpacing;
          }
          return horizontalGridPositions;
        }

        // Gets vertical grid positions based on position of droppable staff lines.
        function updateVerticalGridPositions() {
          var verticalGridPositions = {};
          var staffLinePositions = getStaffLinePositions();
          for ( var i = 0; i < verticalGridKeys.length; i++) {
            verticalGridPositions[verticalGridKeys[i]] = staffLinePositions[i];
          }
          return verticalGridPositions;
        }

        // Converts the midiValue of a droppable line that a note is on 
        // into a top position.
        function getVerticalPosition(baseNoteMidiNumber) {
          return verticalGridPositions[baseNoteMidiNumber];
        }

        // Gets position of note by using the noteStart to hash in to available
        // horizontalGridPositions.
        function getHorizontalPosition(noteStart) {
          return horizontalGridPositions[noteStart];
        }

        function getContainerWidth() {
          return $('.oppia-music-input-staff').width();
        }

        // Gets first horizontal grid position by dividing the width of the staff 
        // by half the width of a note.
        function computeFirstHorizontalPosition() {
          return $('.oppia-music-input-staff').width() /
            ($('.oppia-music-input-natural-note').width() / 2);
        }

        // Gets the staff height by dividing staff by a percentage of staff width.
        function computeContainerHeight(containerWidth) {
          return containerWidth / 4.9124087;
        }

        // Gets the staff top by dividing staff by a percentage of staff width.
        function computeStaffTop(containerHeight) {
          return containerHeight / 2;
        }

        // Gets the staff bottom by dividing staff by a percentage of staff width.
        function computeStaffBottom(containerHeight) {
          return containerHeight / 0.604;
        }

        // Gets the horizontal spacing by dividing the staff width by the
        // number of notes that can be placed on the staff.
        function computeHorizontalGridSpacing(containerWidth) {
          return containerWidth / 9;
        }

        // Removes notes from staff.
        function clearPalette() {
          $('.oppia-music-input-note-choices div').remove();
        }

        // Removes droppable staff lines.
        function clearDroppableStaff() {
          $('.oppia-music-input-staff div').remove();
        }

        var staffLinePositions = getStaffLinePositions();

        // Returns an Array containing the vertical positions of the staff lines.
        function getStaffLinePositions() {
          var staffLinePositions = [];
          $('.oppia-music-input-staff div').each(function() {
            staffLinePositions.push($(this).position().top);
          });
          return staffLinePositions;
        }

        // Returns the nearest staff line that a note is dropped close to.
        function findNearestStaffLine(notePosition, epsilon) {
          var staffLinePositions = getStaffLinePositions();
          for (var i = 0; i < staffLinePositions.length; i++) {
            if (Math.abs(staffLinePositions[i] - notePosition) < epsilon) {
              return staffLinePositions[i];
            }
          }
          return;
        }

        function noteIsOffStaff(helperClone) {
          return (!(helperClone.position().top > staffTop &&
                  helperClone.position().top < staffBottom) ||
                  helperClone.position().left > RIGHT_EDGE_OF_STAFF_POSITION);
        }

        function checkIfNotePositionTaken(leftPos) {
          for (var i = 0; i < noteSequence.length; i++) {
            if (setNoteStart(leftPos) !== undefined &&
                noteSequence[i].note.noteStart['num'] ===
                setNoteStart(leftPos)['num']) {
              return true;
            }
          }
          return false;
        }

        // Checks a moved note's top position against the possible staff line 
        // positions. If note is on a valid staff line position, 
        // it will not be reverted
        function noteIsOutOfDroppable(note) {
          staffLinePositions = getStaffLinePositions();
          for (var i = 0; i < staffLinePositions.length; i++) {
            if (Math.floor(staffLinePositions[i]) ===
                Math.floor(note.position().top + NOTE_OFFSET)) {
              return false;
            }
          }
          return true;
        }

        // This function removes the previous instance of a note that has 
        // been moved to a new position. This checks to make sure that the 
        // noteId is the same but that it is not the more recent version.
        // Otherwise there would be a "trail" for each note's previous positions.
        function removeNote(note) {
          for (var i = 0; i < noteSequence.length; i++) {
            if (noteSequence[i].note.noteId === note.noteId &&
                noteSequence[i].note !== note) {
              noteSequence.splice(i, 1);
              return;
            }
          }
        }

        // Removes a note from the noteSequence if it is dropped off the staff.
        function revertNote(note) {
          for (var i = 0; i < noteSequence.length; i++) {
            if (noteSequence[i].note.noteId === note.data('noteId')) {
              noteSequence.splice(i, 1);
              return;
            }
          }
        }

        // Sorts noteSequence by each note's noteStart property.
        function sortNoteSequence() {
          noteSequence.sort(function(a, b) {
            if (a.note.noteStart && b.note.noteStart) {
              return a.note.noteStart['num'] - b.note.noteStart['num'];
            }
          });
        }

        // Clear noteSequence values and remove all notes 
        // and Ledger Lines from the staff.
        $scope.clearSequence = function() {
          noteSequence = [];
          $('.oppia-music-input-on-staff').remove();
          $('.oppia-music-input-ledger-line').remove();
        };

        // Converts a note's leftPosition to a noteStart object by checking if 
        // leftPos is close to available horizontal grid position.
        function setNoteStart(leftPos) {
          for (var i = 1; i <= Object.keys(horizontalGridPositions).length; i++) {
            if ((leftPos - horizontalGridPositions[i]) < 2) {
              return {'num': i, 'den': 1};
            }
          }
        }

        function isLedgerLineNote(lineValue) {
          return (lineValue === 'C4' || lineValue === 'A5');
        }

        function drawLedgerLine(topPos, leftPos, lineValue) {
          var ledgerLine = $('<div></div>');
          ledgerLine.appendTo('.oppia-music-input-staff')
          .addClass('oppia-music-input-ledger-line oppia-music-input-natural-note')
          .droppable({
            accept: '.oppia-music-input-note-choices div',
            // Over and out are used to remove helper clone if 
            // note is not placed on staff.
            over: function( event, ui ) {
            },
            out: function(event, ui) {
              $(this).hide();
            },
            hoverClass: 'oppia-music-input-hovered',
            containment: '.oppia-music-input-valid-note-area',
          })
          .css({
            left: leftPos - 1.6,
            top: topPos,
            background: '#000000'
          });
        }

        function _getCorrespondingNoteName(baseNoteMidiNumber) {
          var correspondingNoteName = null;
          for (var noteName in NOTE_NAMES_TO_MIDI_VALUES) {
            if (NOTE_NAMES_TO_MIDI_VALUES[noteName] === baseNoteMidiNumber) {
              correspondingNoteName = noteName;
              break;
            }
          }
          if (correspondingNoteName === null) {
            console.error('Invalid MIDI pitch: ' + baseNoteMidiNumber);
          }
          return correspondingNoteName;
        }

        /*
         * Returns a full note name, such as Eb5, A5 or F#4, given a MIDI number
         * and a sharp/flat offset. For example, (62, -1) returns 'Eb4' 
         * (since '62' is the MIDI number for Eb, and -1 indicates a flat).
         *
         * @param {number} baseNoteMidiNumber An integer value denoting the 
         *    MIDI number of the staff-line.
         * @param {number} accidentalOffset A value of -1, 0 or 1, denoting a flat,
         *   natural, or sharp, respectively.
         */
        function _convertNoteToReadableNote(note) {
          if (note.offset !== -1 && note.offset !== 0 && note.offset !== 1) {
            console.error('Invalid note offset: ' + note.offset);
          }

          var correspondingNoteName =
            _getCorrespondingNoteName(note.baseNoteMidiNumber);

          var accidental = (note.offset === 1 ? '#' :
                            note.offset === 0 ? '' : 'b');

          return {
            'readableNoteName':
              correspondingNoteName[0] + accidental + correspondingNoteName[1],
            'noteDuration': {'num': 1, 'den': 1}
          };
        }

        /*
         * Returns a Note (an object with keys 'baseNoteMidiNumber' and 'offset'), 
         * given a String readableNote.
         */
        function _convertReadableNoteToNote(readableNote) {
          var readableNoteName = readableNote;
          if (readableNoteName.length === 2) {
            // This is a natural note.
            return {
              baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[readableNoteName],
              offset: 0
            };
          } else if (readableNoteName.length === 3) {
            // This is a note with an accidental.
            var offset = (readableNoteName[1] === '#') ? 1 :
                         (readableNoteName[1] === 'b') ? -1 : null;
            if (offset === null) {
              console.error('Invalid readable note: ' + readableNoteName);
            }

            return {
              baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[readableNoteName[0] +
                readableNoteName[2]],
              offset: offset
            };
          } else {
            // This is not a valid readableNote.
            console.error('Invalid readable note: ' + readableNote);
          }

          if (note.offset !== -1 && note.offset !== 0 && note.offset !== 1) {
            console.error('Invalid note offset: ' + note.offset);
          }

          var correspondingNoteName =
            _getCorrespondingNoteName(note.baseNoteMidiNumber);

          var accidental = (note.offset === 1 ? '#' :
                            note.offset === 0 ? '' : 'b');

          return correspondingNoteName[0] + accidental + correspondingNoteName[1];
        }

        $scope.answer = [];

        $scope.submitAnswer = function(answer) {
          var readableSequence = [];
          for (var i = 0; i < noteSequence.length; i++) {
            readableSequence.push(_convertNoteToReadableNote(noteSequence[i].note));
          }
          $scope.$parent.$parent.submitAnswer(readableSequence, 'submit');
        };


        /*******************************************************************
         * Functions involving MIDI playback.
         ******************************************************************/

        $scope.MIDI_CHANNEL = 0;
        $scope.MIDI_VELOCITY = 127;
        $scope.MIDI_DELAY = 1;



        $scope.playSequenceToGuess = function() {
          var noteSequenceToGuess = [];
          for (var i = 0; i < $scope.sequenceToGuess.length; i++) {
            noteSequenceToGuess.push(
              _convertReadableNoteToNote(
                $scope.sequenceToGuess[i].readableNoteName));
          }
          playSequence(noteSequenceToGuess);
        };


        $scope.playCurrentSequence = function() {
          playSequence(noteSequence);
        };

        function getNoteStart(noteIndex) {
          var noteStart = NOTE_POSITION_TO_NOTE_START[noteIndex];
          return noteStart['num'] / noteStart['den'];
        }

        function playSequence(sequence) {
          var midiSequence = convertToMidiSequence(sequence);
          for (var i = 0; i < midiSequence.length; i++) {
            // If first note in sequence, remove delay for immediate playback.
            if (i === 0) {
              playChord(midiSequence[i], 0);
            } else {
              playChord(midiSequence[i], getNoteStart(i));
            }
          }
        }

        function playChord(midiChord, noteStart) {
          MIDI.noteOn(
            $scope.MIDI_CHANNEL, midiChord, $scope.MIDI_VELOCITY, noteStart
          );
        }

        // A MIDI pitch is the baseNoteMidiNumber of the note plus the offset.
        function _convertNoteToMidiPitch(note) {
          return note.baseNoteMidiNumber + note.offset;
        }

        function convertToMidiSequence(sequence) {
          // Return the MIDI value for each note in the sequence.
          // A note may come from noteSequence or $scope.sequenceToGuess
          var midiSequence = [];
          for (var i = 0; i < sequence.length; i++) {
            if (sequence[i].hasOwnProperty('note')) {
              // Check for a chord.
              if (i+1 < sequence.length &&
                  (sequence[i].note.noteStart['num'] ===
                  sequence[i+1].note.noteStart['num']) &&
                  (sequence[i].note.noteStart['den'] ===
                  sequence[i+1].note.noteStart['den'])) {
                // TODO - make chordPosition an object representation
                var chordPosition = sequence[i].note.noteStart['num'];
                var chord = [];
                for (var j = 0; j < sequence.length; j++) {
                  if (sequence[j].note.noteStart['num'] === chordPosition) {
                    chord.push(_convertNoteToMidiPitch(sequence[j].note));
                  }
                }
                midiSequence.push(chord);
                // This moves the index of the sequence past the chord 
                // so that the last note is not repeated.
                i += (~~(chord.length - (chord.length/2)));
                if (chord.length > 2) {
                  i++;
                }
              } else {
                // Single note.
                midiSequence.push([_convertNoteToMidiPitch(sequence[i].note)]);
              }
            } else if (sequence[i].hasOwnProperty('baseNoteMidiNumber')) {
              // Note from $scope.sequenceToGuess.
              midiSequence.push([_convertNoteToMidiPitch(sequence[i])]);
            } else {
              console.error('Invalid note: ' + sequence[i]);
            }
          }
          return midiSequence;
        }
      }]
    };
  }
]);
