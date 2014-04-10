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
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
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
          0: {'num': 1, 'den': 1},
          1: {'num': 2, 'den': 1},
          2: {'num': 3, 'den': 1},
          3: {'num': 4, 'den': 1},
          4: {'num': 5, 'den': 1},
          5: {'num': 6, 'den': 1},
          6: {'num': 7, 'den': 1},
          7: {'num': 8, 'den': 1}
        };

        /**
         * This Object holds the values for the available vertical positions
         * on the staff. It is updated by calls to getAllVerticalPositions().
         * The keys are the verticalGridKeys which represent the midiValue
         * associated with each staff line. The values are the top positions for
         * each staff line.
         */
        var verticalGridPositions = {};

        var verticalGridKeys = [
          81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60
        ];

        // Highest number of notes that can fit on the staff at any given time.
        var MAXIMUM_NOTES_POSSIBLE = 8;

        var noteChoicesElt = $('.oppia-music-input-note-choices');
        var staffContainerElt = $('.oppia-music-input-staff');

        // Sets grid positions and initializes widget after staff has loaded.
        $(document).ready(function() {
          setTimeout(function() {
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
            (MAXIMUM_NOTES_POSSIBLE + 1);

          $scope.VERTICAL_GRID_SPACING = $scope.CONTAINER_HEIGHT /
            verticalGridKeys.length;

          staffTop = computeStaffTop();
          staffBottom = computeStaffBottom();

          // The farthest edge of the staff. If a note is placed beyond this
          // position, it will be discarded.
          RIGHT_EDGE_OF_STAFF_POSITION =
            $('.oppia-music-input-valid-note-area').width();

          clearNotesFromStaff();
          initPalette();

          clearDroppableStaff();
          buildDroppableStaff();

          verticalGridPositions = getAllVerticalGridPositions();

          repaintNotes();
        };

        $scope.init();

        // Gets vertical grid positions based on position of droppable staff lines.
        function getAllVerticalGridPositions() {
          var verticalGridPositions = {};
          var staffLinePositions = getStaffLinePositions();
          for (var i = 0; i < staffLinePositions.length; i++) {
            verticalGridPositions[verticalGridKeys[i]] = staffLinePositions[i];
          }
          return verticalGridPositions;
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
        function clearNotesFromStaff() {
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
            // reference) whose positions when rounded down are >= 0.
            if (Math.floor($(this).position().top) > 0) {
              staffLinePositions.push($(this).position().top);
            }
          });
          return staffLinePositions;
        }

        function initPalette() {
          // Creates the notes and helper-clone notes for the noteChoices div.
          for (var i = 0; i < NOTE_TYPES.length; i++) {
            $('<div></div>')
            .data('noteType', NOTE_TYPES[i])
            .addClass(function () {
              if ($(this).data('noteType') === NOTE_TYPE_NATURAL) {
                $(this).addClass('oppia-music-input-natural-note');
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
              stop: function(evt, ui) {
                if (!noteIsOffStaff($(ui.helper))) {
                  // This makes the helper clone a new draggable note.
                  var helperClone = $(ui.helper)
                  // Retains original note type (e.g. natural, flat, sharp).
                  .data('noteType', $(this).data('noteType'))
                  .draggable({
                    // The leftPosBeforeDrag helps with the sorting of user sequence.
                    start: function(evt, ui) {
                      $(this).data('leftPosBeforeDrag', $(this).position().left);
                    },
                    containment: '.oppia-music-input-valid-note-area',
                    cursor: 'pointer',
                    grid: [$scope.HORIZONTAL_GRID_SPACING, 1],
                    // Stops helper clone from being cloned again.
                    helper: 'original',
                    stack: '.oppia-music-input-note-choices div',
                    tolerance: 'intersect',
                    revert: function() {
                      var draggableOptions = $(this);
                      // If note is out of droppable or off staff, remove it.
                      if (noteIsOffStaff(draggableOptions)) {
                        removeNotesFromNoteSequenceWithId(draggableOptions.data(
                                                          'noteId'));
                        sortNoteSequence();
                        draggableOptions.remove();
                      }
                    }
                  });
                }
              }
            });
          }
        }

        function repaintNotes() {
          var noteSequence = getNoteSequence();
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
                start: function(evt, ui) {
                  $(this).data('leftPosBeforeDrag', $(this).position().left);
                },
                revert: function(evt, ui) {
                  var draggableOptions = $(this);
                  // If note is out of droppable or off staff, remove it.
                  if (noteIsOffStaff(draggableOptions)) {
                    removeNotesFromNoteSequenceWithId(draggableOptions.data('noteId'));
                    sortNoteSequence();
                    draggableOptions.remove();
                  }
                }
              })
              // Position notes horizontally by their noteStart positions and
              // vertically by the midi value they hold.
              .css({
                top:
                  getVerticalPosition(noteSequence[i].note.baseNoteMidiNumber) -
                    $scope.VERTICAL_GRID_SPACING / 2.0,
                left:
                  getHorizontalPosition(getNoteStartAsFloat(noteSequence[i].note))
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
              .data('lineValue', lineValues[i])
              .appendTo('.oppia-music-input-staff')
              .droppable({
                accept: '.oppia-music-input-note-choices div',
                // Over and out are used to remove helper clone if
                // note is not placed on staff.
                over: function(evt, ui) {
                  var lineValue = $(evt.target).data('lineValue');

                  // Draws a ledger-line when note is hovering over staff-line.
                  if (isLedgerLineNote(lineValue)) {
                    // Position of current dropped note.
                    var leftPos = ui.helper.position().left;
                    var topPos = $(evt.target).position().top;
                    var noteId = $(ui.helper).data('noteId');
                    if (noteId === undefined) {
                      noteId = $scope.generateNoteId();
                      $(ui.helper).data('noteId', noteId);
                    }
                    drawLedgerLine(topPos, leftPos, lineValue, noteId);
                  }
                },
                out: function(evt, ui) {
                  // Removes a ledger line when note is dragged out of droppable.
                  $('.oppia-music-input-ledger-line').last().hide();
                },
                hoverClass: 'oppia-music-input-hovered',
                // Handles note drops and appends new note to noteSequence.
                drop: function(evt, ui) {
                  // Makes helper clone not disappear when dropped on staff.
                  $.ui.ddmanager.current.cancelHelperRemoval = true;

                  $('.oppia-music-input-ledger-line').last().hide();

                  // Previous position of note or undefined.
                  var startPos = $(ui.helper).data('leftPosBeforeDrag');

                  // Position of current dropped note.
                  var leftPos = ui.helper.position().left;
                  var leftPosBeforeMove = leftPos;
                  var topPos = $(evt.target).position().top;

                  // The staff line's value.
                  var lineValue = $(this).data('lineValue');
                  var noteType = ui.draggable.data('noteType');

                  // A note that is dragged from noteChoices box
                  // has an undefined noteId. This sets the id.
                  // Otherwise, the note has an id.
                  var noteId = $(ui.helper).data('noteId');
                  if (noteId === undefined) {
                    noteId = $scope.generateNoteId();
                    $(ui.helper).data('noteId', noteId);
                  }

                  // Creates a note object.
                  var note = {
                    baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[lineValue],
                    offset: parseInt(noteType, 10),
                    noteId: noteId,
                    noteDuration: 4,
                  };

                  // When a note is moved, its previous state must be removed
                  // from the noteSequence. Otherwise, the sequence would
                  // erroneously hold notes that have been moved to other
                  // positions. Also this allows an on-staff note's position
                  // to be freed up if it is moved.
                  removeNotesFromNoteSequenceWithId(note.noteId);

                  // Makes sure that a note can move vertically on it's position.
                  if (startPos !== leftPos) {
                    // Moves the note to the next available spot on the staff.
                    // If the staff is full, note is moved off staff,
                    // and thus removed.
                    while (checkIfNotePositionTaken(leftPos)) {
                      leftPos += $scope.HORIZONTAL_GRID_SPACING;
                    }
                    $(ui.helper).css({top: topPos, left: leftPos});

                    if (Math.floor(leftPos) > Math.floor(
                        getHorizontalPosition(MAXIMUM_NOTES_POSSIBLE))) {
                      removeNotesFromNoteSequenceWithId(note.noteId);
                      $(ui.helper).remove();
                      repaintLedgerLines();
                      return;
                    }
                  }

                  // Adjusts note so it is right on top of the staff line by
                  // calculating half of the VERTICAL_GRID_SPACING and
                  // subtracting that from its current top Position.
                  $(ui.helper).css({top: topPos -
                    ($scope.VERTICAL_GRID_SPACING / 2.0)});

                  // Add noteStart property to note object.
                  if (getNoteStartFromLeftPos(leftPos) !== undefined) {
                    note.noteStart =
                      getNoteStartFromLeftPos(leftPos).note.noteStart;
                  } else {
                    removeNotesFromNoteSequenceWithId(noteId);
                    repaintLedgerLines();
                    return;
                  }

                  addNoteToNoteSequence(note);
                  sortNoteSequence();

                  // Sounds the note when it is dropped onto staff.
                  playChord([_convertNoteToMidiPitch(note)]);
                  $(ui.helper).addClass('oppia-music-input-on-staff');

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

        function addNoteToNoteSequence(note) {
          noteSequence.push({note: note});
        }

        function getNoteSequence() {
          return noteSequence;
        }

        // Remove a specific note with given noteId from noteSequence.
        function removeNotesFromNoteSequenceWithId(noteId) {
          for (var i = 0; i < noteSequence.length; i++) {
            if (noteSequence[i].note.noteId === noteId) {
              noteSequence.splice(i, 1);
              return;
            }
          }
          return;
        }

        // Sorts noteSequence elements according to the return value of the
        // compareNoteStarts function.
        function sortNoteSequence() {
          noteSequence.sort(compareNoteStarts);
        }

        // When compareNoteStarts(a, b) returns less than 0, a is less than b.
        // When compareNoteStarts(a, b) returns 0, a is equal to b.
        // When compareNoteStarts(a, b) returns greater than 0, a is greater than b.
        function compareNoteStarts(a, b) {
          if (a.note.noteStart && b.note.noteStart) {
            return getNoteStartAsFloat(a.note) - getNoteStartAsFloat(b.note);
          }
        }

        // If a note position is taken, return true,
        // otherwise the position is available
        function checkIfNotePositionTaken(leftPos) {
          var newNoteToCheck;
          if (getNoteStartFromLeftPos(leftPos)) {
            newNoteToCheck = getNoteStartFromLeftPos(leftPos);
            if (newNoteToCheck.note.noteStart !== undefined) {
              for (var i = 0; i < noteSequence.length; i++) {
                if (compareNoteStarts(noteSequence[i], newNoteToCheck) === 0) {
                  return true;
                }
              }
              return false;
            }
          }
          return;
        }

        // Converts a note's leftPosition to a noteStart object by checking if
        // leftPos is close to available horizontal grid position. If there is
        // not a close match, return undefined.
        function getNoteStartFromLeftPos(leftPos) {
          for (var i = 1; i <= MAXIMUM_NOTES_POSSIBLE; i++) {
            // If the difference between leftPos and a horizontalGrid Position
            // is less than 2, then they are close enough to set a position. This
            // gives some wiggle room for rounding differences.
            if (Math.abs(leftPos - getHorizontalPosition(i)) < 2) {
              var note = {};
              note.noteStart = {'num': i, 'den': 1};
              return {note:note};
            }
          }
          return undefined;
        }

        function getNoteStartAsFloat(note) {
          return note.noteStart.num / note.noteStart.den;
        }

        // Clear noteSequence values and remove all notes
        // and Ledger Lines from the staff.
        $scope.clearSequence = function() {
          noteSequence = [];
          $('.oppia-music-input-on-staff').remove();
          $('.oppia-music-input-ledger-line').remove();
        };

        // Converts the midiValue of a droppable line that a note is on
        // into a top position.
        function getVerticalPosition(baseNoteMidiNumber) {
          return verticalGridPositions[baseNoteMidiNumber];
        }

        /**
         * Gets a horizontal grid position based on the position of note-choices
         * div. '.oppia-music-input-note-choices div:first-child' (the note that
         * gets cloned to create all other subsequent notes) is the last
         * horizontal position, so to determine the others values, we multiply
         * the MAXIMUM_NOTES_POSSIBLE that will fit on the staff by the
         * $scope.HORIZONTAL_GRID_SPACING and subtract that from the last
         * Horizontal Position value and return the result.
         */
        function getHorizontalPosition(noteStartAsFloat) {
          var lastHorizontalPositionOffset =
            $('.oppia-music-input-note-choices div:first-child').position().left;
          var leftOffset =
            lastHorizontalPositionOffset - (MAXIMUM_NOTES_POSSIBLE *
                            $scope.HORIZONTAL_GRID_SPACING);
          return leftOffset + (noteStartAsFloat * $scope.HORIZONTAL_GRID_SPACING);
        }

        function noteIsOffStaff(helperClone) {
          return (!(helperClone.position().top > staffTop &&
                  helperClone.position().top < staffBottom) ||
                  helperClone.position().left > RIGHT_EDGE_OF_STAFF_POSITION);
        }

        function isLedgerLineNote(lineValue) {
          return LEDGER_LINE_NOTES.indexOf(lineValue) !== -1;
        }

        function drawLedgerLine(topPos, leftPos, lineValue, noteId) {
          var ledgerLine = $('<div></div>');
          ledgerLine.appendTo('.oppia-music-input-staff')
          .addClass('oppia-music-input-ledger-line oppia-music-input-natural-note')
          .addClass(noteId + ' ' + leftPos)
          .droppable({
            accept: '.oppia-music-input-note-choices div',
            // When a ledgerLine note is moved out of it's droppable,
            // remove ledger line.
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
                getHorizontalPosition(getNoteStartAsFloat(noteSequence[i].note)),
                lineValue,
                noteSequence[i].note.noteId
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
          playSequence(convertSequenceToGuessToMidiSequence(noteSequenceToGuess));
        };

        $scope.playCurrentSequence = function() {
          playSequence(convertNoteSequenceToMidiSequence(noteSequence));
        };

        // Takes an input > 0, converts to a noteStart object and returns a
        // float representation of the noteStart position.
        function getNoteStart(noteIndex) {
          var note = {};
          note.noteStart = NOTE_POSITION_TO_NOTE_START[noteIndex];
          return getNoteStartAsFloat(note);
        }

        // Input is a midiSequence, which is an array of arrays, in the form of
        // [[72], [62], [67, 71, 74]]. An inner array with more than one value is
        // treated like a chord and all its values are played back simultaneously.
        function playSequence(midiSequence) {
          for (var i = 0; i < midiSequence.length; i++) {
            for (var j = 0; j < midiSequence[i].length; j++) {
              playChord(midiSequence[i][j], getNoteStart(i) - 1);
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

        // Return the MIDI value for each note in the sequence.
        // TODO (wagnerdmike) - add chord functionality.
        function convertSequenceToGuessToMidiSequence(sequence) {
          var midiSequence = [];
          for (var i = 0; i < sequence.length; i++) {
            if (sequence[i].hasOwnProperty('baseNoteMidiNumber')) {
              midiSequence.push([_convertNoteToMidiPitch(sequence[i])]);
            } else {
              console.error('Invalid note: ' + sequence[i]);
            }
          }
          return midiSequence;
        }

        // Return the MIDI value for each note in the sequence.
        // TODO (wagnerdmike) - add chord functionality.
        function convertNoteSequenceToMidiSequence(sequence) {
          var midiSequence = [];
          for (var i = 0; i < sequence.length; i++) {
            if (sequence[i].hasOwnProperty('note')) {
              // Single note.
              midiSequence.push([_convertNoteToMidiPitch(sequence[i].note)]);
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
