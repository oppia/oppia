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

        /** Array to hold the notes placed on staff. Notes are represented as
         * objects with two keys: baseNoteMidiNumber and offset. The
         * baseNoteMidiNumber is an integer value denoting the MIDI number of
         * the staff-line the note is on, and the offset is either -1, 0 or 1,
         * denoting a flat, natural or sharp respectively.
         */
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

        var NOTES_ON_LINES = ['E4', 'G4', 'B4', 'D5', 'F5'];
        var LEDGER_LINE_NOTES = ['C4', 'A5'];

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

        // This Object holds the values for the available horizontal positions
        // on the staff. It is updated by calls to getAllHorizontalPositions().
        // The keys are the horizontalGridKeys (integers ranging from 1 to 8
        // inclusive). The values are the left positions of the staff.
        var horizontalGridPositions = {};

        // This Object holds the values for the available vertical positions
        // on the staff. It is updated by calls to getAllVerticalPositions().
        // The keys are the verticalGridKeys which represent the midiValue
        // associated with each staff line. The values are the top positions for
        // each staff line.
        var verticalGridPositions = {};

        var verticalGridKeys = [
          81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60
        ];

        var horizontalGridKeys = [1, 2, 3, 4, 5, 6, 7, 8];

        // Highest number of notes that can fit on the staff at any given time.
        var MAXIMUM_NOTES_POSSIBLE = 8;

        var noteChoicesElt = $('.oppia-music-input-note-choices');
        var staffContainerElt = $('.oppia-music-input-staff');

        // Sets grid positions and initializes widget after staff has loaded.
        $(document).ready(function() {
          setTimeout(function() {
            horizontalGridPositions = getAllHorizontalGridPositions();
            verticalGridPositions = getAllVerticalGridPositions();
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

          $scope.CONTAINER_WIDTH = staffContainerElt.width();
          $scope.CONTAINER_HEIGHT = 0.2 * $scope.CONTAINER_WIDTH;

          // The grid rectangle dimensions defining the grid which the notes
          // fall on.
          $scope.HORIZONTAL_GRID_SPACING = $scope.CONTAINER_WIDTH /
            MAXIMUM_NOTES_POSSIBLE + 1;
          $scope.VERTICAL_GRID_SPACING = $scope.CONTAINER_HEIGHT /
            verticalGridKeys.length;

          staffTop = computeStaffTop();
          staffBottom = computeStaffBottom();

          // The farthest edge of the staff. If a note is placed beyond this
          // position, it will be discarded.
          RIGHT_EDGE_OF_STAFF_POSITION =
            $('.oppia-music-input-valid-note-area').width();

          clearPalette();
          initPalette();

          clearDroppableStaff();
          buildDroppableStaff();

          horizontalGridPositions = getAllHorizontalGridPositions();
          verticalGridPositions = getAllVerticalGridPositions();

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
              grid: [$scope.HORIZONTAL_GRID_SPACING, 1],
              stop: function(event, ui) {
                if (!noteIsOffStaff($(ui.helper))) {
                  // This makes the helper clone a new draggable note.
                  var helperClone = $(ui.helper)
                  // Retains original note type (e.g. natural, flat, sharp).
                  .data('noteType', $(this).data('noteType'))
                  .draggable({
                    // The startLeftPos helps with the sorting of user sequence.
                    start: function(event, ui) {
                      $(this).data('startLeftPos', $(this).position().left);
                    },
                    containment: '.oppia-music-input-valid-note-area',
                    cursor: 'pointer',
                    grid: [$scope.HORIZONTAL_GRID_SPACING, 1],
                    // Stops helper clone from being cloned again.
                    helper: 'original',
                    stack: '.oppia-music-input-note-choices div',
                    tolerance: 'intersect',
                    revert: function() {
                      // If note is out of droppable or off staff, remove it.
                      if (noteIsOffStaff($(this))) {
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
                grid: [$scope.HORIZONTAL_GRID_SPACING, 1],
                start: function(event, ui) {
                  $(this).data('startLeftPos', $(this).position().left);
                },
                revert: function(event, ui) {
                  // If note is out of droppable or off staff, remove it.
                  if (noteIsOffStaff($(this))) {
                    revertNote($(this));
                    sortNoteSequence();
                    $(this).remove();
                  }
                }
              })
              // Position notes in relation to where they were before resize.
              .css({
                top:
                  getVerticalPosition(noteSequence[i].note.baseNoteMidiNumber) -
                    $scope.VERTICAL_GRID_SPACING / 2.0,
                left:
                  getHorizontalPosition(noteSequence[i].note.noteStart['num'] *
                                        noteSequence[i].note.noteStart['den'])
              });
            repaintLedgerLines();
          }
        }

        function buildDroppableStaff() {
          // Creates a staff of droppable lines.
          var lineValues = Object.keys(NOTE_NAMES_TO_MIDI_VALUES);
          for (var i = 0; i < lineValues.length; i++) {
            var staffLineDiv = $('<div></div>')
              .addClass('oppia-music-staff-position')
              .css('height', $scope.VERTICAL_GRID_SPACING)
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
                    drawLedgerLine(topPos, leftPos, lineValue,
                      $(ui.helper).data('noteId'));
                  }
                },
                out: function(event, ui) {
                  var leftPos = ui.helper.position().left;
                  var startPos = $(ui.helper).data('startLeftPos');

                  // Removes a ledger line when note is dragged out of droppable.
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
                  var leftPosBeforeMove = leftPos;
                  var topPos = $(event.target).position().top;

                  // The staff line's value.
                  var lineValue = $(this).data('line-value');
                  var noteValue = ui.draggable.data('noteType');

                  // A note that is dragged from noteChoices box
                  // has an undefined noteId. This sets the id.
                  // Otherwise, the note has an id.
                  var noteId = $(ui.helper).data('noteId');
                  if (noteId === undefined) {
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
                  };

                  // Makes sure that a note can move vertically on it's position.
                  if (startPos !== leftPos) {
                    // If new note doesn't exceed the maximum note's that can fit
                    // on staff, then see if a position is available. Otherwise,
                    // remove the note.
                    if (noteSequence.length + 1 <= MAXIMUM_NOTES_POSSIBLE) {

                      // Moves the note to the next available spot on the staff.
                      // If the staff is full, note is moved off staff,
                      // and thus removed.
                      while (checkIfNotePositionTaken(leftPos)) {
                        leftPos += $scope.HORIZONTAL_GRID_SPACING;
                      }
                      $(ui.helper).css({top: topPos, left: leftPos});

                      if (Math.floor(leftPos) > Math.floor(
                          getHorizontalPosition(MAXIMUM_NOTES_POSSIBLE))) {
                        removeNote(note);
                        $(ui.helper).remove();
                      }
                    } else {
                      removeNote(note);
                      $(ui.helper).remove();
                    }
                  }

                  // Adjusts note so it is right on top of the staff line by
                  // calculating half of the VERTICAL_GRID_SPACING and
                  // subtracting that from its current top Position.
                  $(ui.helper).css({top: topPos -
                    ($scope.VERTICAL_GRID_SPACING / 2.0)});

                  // Add noteStart property to note object.
                  note.noteStart = setNoteStart(leftPos);

                  // Draws ledger lines when note is dropped.
                  if (isLedgerLineNote(lineValue) && !noteIsOffStaff($(ui.helper))) {
                    drawLedgerLine(topPos, leftPos, lineValue, $(ui.helper).data('noteId'));
                  }

                  if (noteIsOffStaff($(ui.helper))) {
                    removeNote(note);
                    $(ui.helper).remove();
                  } else {
                    noteSequence.push({note: note});
                    // When a note is moved, its previous state must be removed
                    // from the noteSequence. Otherwise, the sequence would
                    // erroneously hold notes that have been moved to other
                    // positions.
                    removeNote(note);

                    sortNoteSequence();
                    // Sounds the note when it is dropped onto staff.
                    playChord([_convertNoteToMidiPitch(note)]);
                    $(ui.helper).addClass('oppia-music-input-on-staff');
                  }

                  repaintLedgerLines();
                }
              });

            if (i === 0) {
              $scope.topPositionForCenterOfTopStaffLine =
                $(staffLineDiv).position().top + $scope.VERTICAL_GRID_SPACING;
            }

            var noteName = lineValues[i];

            // Check if noteName is a valid staff line and if so, paint staff line.
            if (NOTES_ON_LINES.indexOf(noteName) !== -1) {
              $('<div></div>')
              // Positions and centers the staff line directly on top of its
              // associated droppable.
              .css('margin-top', $scope.VERTICAL_GRID_SPACING / 2.5)
              .addClass('oppia-music-staff-line')
              .appendTo(staffLineDiv);
            }
          }
        }

        // Gets horizontal grid positions based on the position of note-choices div.
        function getAllHorizontalGridPositions() {
          var horizontalGridPositions = {};
          var leftPosition =
            $('.oppia-music-input-note-choices div:first-child').position().left;
          for (var i = horizontalGridKeys.length; i >= 1; i--) {
            horizontalGridPositions[i] = leftPosition;
            leftPosition -= $scope.HORIZONTAL_GRID_SPACING;
          }
          return horizontalGridPositions;
        }

        // Gets vertical grid positions based on position of droppable staff lines.
        function getAllVerticalGridPositions() {
          var verticalGridPositions = {};
          var staffLinePositions = getStaffLinePositions();
          for (var i = 0; i < staffLinePositions.length; i++) {
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

        // Gets first horizontal grid position by dividing the width of the staff
        // by half the width of a note.
        function computeFirstHorizontalPosition() {
          return $('.oppia-music-input-staff').width() /
            ($('.oppia-music-input-natural-note').width() / 2);
        }

        // Gets the staff top by getting the first staff line's position and
        // subtracting one vertical grid space from it.
        function computeStaffTop() {
          return getStaffLinePositions()[0] - $scope.VERTICAL_GRID_SPACING;
        }

        // Gets the staff bottom position by adding the staff top position value
        // with the total sum of all the vertical grid spaces (staff lines).
        function computeStaffBottom() {
          return computeStaffTop() + (
            $scope.VERTICAL_GRID_SPACING * verticalGridKeys.length);
        }

        // Removes all notes from staff.
        function clearPalette() {
          $('.oppia-music-input-note-choices div').remove();
        }

        // Removes all droppable staff lines.
        function clearDroppableStaff() {
          $('.oppia-music-input-staff div').remove();
        }

        var staffLinePositions = getStaffLinePositions();

        // Returns an Array containing the vertical positions of the staff lines.
        function getStaffLinePositions() {
          var staffLinePositions = [];
          $('.oppia-music-input-staff div').each(function() {
            // Only take the positions of the droppable staff line divs,
            // not their non-droppable lines (which are only there for a visual
            // reference) whose positions, which are not yet set, are below 1.
            if ($(this).position().top > 1) {
              staffLinePositions.push($(this).position().top);
            }
          });
          return staffLinePositions;
        }

        function noteIsOffStaff(helperClone) {
          return (!(helperClone.position().top > staffTop &&
                  helperClone.position().top < staffBottom) ||
                  helperClone.position().left > RIGHT_EDGE_OF_STAFF_POSITION);
        }

        function compareNoteStarts(noteStartA, noteStartB) {
          var numA = noteStartA['num'];
          var denA = noteStartA['den'];
          var numB = noteStartB['num'];
          var denB = noteStartB['den'];

          if (numA * denB === numB * denA) {
            return true;
          }
          return false;
        }

        // If a note position is taken, return true,
        // otherwise the position is available
        function checkIfNotePositionTaken(leftPos) {
          for (var i = 0; i < noteSequence.length; i++) {
            if (setNoteStart(leftPos) !== undefined &&
                compareNoteStarts(noteSequence[i].note.noteStart,
                                  setNoteStart(leftPos))) {
              return true;
            }
          }
          return false;
        }

        // Remove the previous instance of a note that has
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
              return (a.note.noteStart['num'] * a.note.noteStart['den']) -
                      (b.note.noteStart['num'] * b.note.noteStart['den']);
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
            // If the difference between leftPos and a horizontalGrid Position
            // is less than 2, then they are close enough to set a position. This
            // gives some wiggle room for rounding differences.
            if ((leftPos - horizontalGridPositions[i]) < 2) {
              return {'num': i, 'den': 1};
            }
          }
        }

        function isLedgerLineNote(lineValue) {
          return LEDGER_LINE_NOTES.indexOf(lineValue) !== -1;
        }

        function drawLedgerLine(topPos, leftPos, lineValue, noteId) {
          var ledgerLine = $('<div></div>');
          ledgerLine.appendTo('.oppia-music-input-staff')
          .addClass('oppia-music-input-ledger-line oppia-music-input-natural-note')
          .addClass(noteId)
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
          // Adjust ledger line to be centered with the note.
          .css({
            left: leftPos - 1,
            // 0.4 is a little less than half to allow for the height of the
            // ledger line when considering its placement.
            top: topPos + $scope.VERTICAL_GRID_SPACING * 0.4,
          });
        }

        function repaintLedgerLines() {
          for (var i = 0; i < noteSequence.length; i++) {
            var lineValue =
              _getCorrespondingNoteName(noteSequence[i].note.baseNoteMidiNumber);
            if (isLedgerLineNote(lineValue)) {
              drawLedgerLine(
                getVerticalPosition(noteSequence[i].note.baseNoteMidiNumber),
                getHorizontalPosition(noteSequence[i].note.noteStart['num'] *
                                      noteSequence[i].note.noteStart['den']),
                lineValue,
                $(this).data('noteId')
              );
            }
          }
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
