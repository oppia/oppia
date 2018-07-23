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
 * Directives and associated services for the MusicNotesInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.factory('musicPhrasePlayerService', ['$timeout', function($timeout) {
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

// Gives the staff-lines human readable values.
oppia.constant('NOTE_NAMES_TO_MIDI_VALUES', {
  A5: 81,
  G5: 79,
  F5: 77,
  E5: 76,
  D5: 74,
  C5: 72,
  B4: 71,
  A4: 69,
  G4: 67,
  F4: 65,
  E4: 64,
  D4: 62,
  C4: 60
});

oppia.directive('oppiaInteractiveMusicNotesInput', [
  'HtmlEscaperService', 'NOTE_NAMES_TO_MIDI_VALUES',
  'musicNotesInputRulesService', 'musicPhrasePlayerService',
  'UrlInterpolationService', 'EVENT_NEW_CARD_AVAILABLE',
  'CurrentInteractionService', 'WindowDimensionsService',
  function(
      HtmlEscaperService, NOTE_NAMES_TO_MIDI_VALUES,
      musicNotesInputRulesService, musicPhrasePlayerService,
      UrlInterpolationService, EVENT_NEW_CARD_AVAILABLE,
      CurrentInteractionService, WindowDimensionsService) {
    return {
      restrict: 'E',
      scope: {
        getLastAnswer: '&lastAnswer',
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/MusicNotesInput/directives/' +
        'music_notes_input_interaction_directive.html'),
      link: function(scope, element, attrs) {
        // This is needed in order for the scope to be retrievable during Karma
        // unit testing. See http://stackoverflow.com/a/29833832 for more
        // details.
        element[0].isolateScope = function() {
          return scope;
        };

        scope.SOUNDFONT_URL = '/third_party/static/midi-js-2ef687/soundfont/';
        scope.sequenceToGuess = HtmlEscaperService.escapedJsonToObj(
          attrs.sequenceToGuessWithValue);

        scope.interactionIsActive = (scope.getLastAnswer() === null);

        scope.initialSequence = scope.interactionIsActive ?
          HtmlEscaperService.escapedJsonToObj(attrs.initialSequenceWithValue) :
          scope.getLastAnswer();

        scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
          scope.interactionIsActive = false;
          scope.initialSequence = scope.getLastAnswer();
          scope.reinitStaff();
        });

        /**
         * A note Object has a baseNoteMidiNumber and an offset property. For
         * example, C#4 would be -> note = {baseNoteMidiNumber: 61, offset: 1};
         *
         * A readableNote Object has a readableNoteName property. For example,
         * Gb5 would be -> readableNote = {readableNoteName: 'Gb5'};
         */

        /**
         * Array to hold the notes placed on staff. Notes are represented as
         * objects with two keys: baseNoteMidiNumber and offset. The
         * baseNoteMidiNumber is an integer value denoting the MIDI number of
         * the staff-line the note is on, and the offset is either -1, 0 or 1,
         * denoting a flat, natural or sharp respectively.
         */
        scope.noteSequence = [];
        scope._addNoteToNoteSequence = function(note) {
          scope.noteSequence.push({
            note: note
          });
        };
        // Remove a specific note with given noteId from noteSequence. If given
        // noteId is not in noteSequence, nothing will be removed.
        scope._removeNotesFromNoteSequenceWithId = function(noteId) {
          for (var i = 0; i < scope.noteSequence.length; i++) {
            if (scope.noteSequence[i].note.noteId === noteId) {
              scope.noteSequence.splice(i, 1);
            }
          }
        };
        // Sorts noteSequence elements according to the return value of the
        // compareNoteStarts function.
        scope._sortNoteSequence = function() {
          scope.noteSequence.sort(compareNoteStarts);
        };

        /**
         * Counter to create unique id for each note dropped on staff.
         */
        scope._currentNoteId = 0;
        scope.generateNoteId = function() {
          scope._currentNoteId += 1;
          return 'note_id_' + (scope._currentNoteId - 1);
        };

        var NOTE_TYPE_NATURAL = 0;
        // TODO More notes types will be added to NOTE_TYPES.
        var NOTE_TYPES = [NOTE_TYPE_NATURAL];

        var NOTES_ON_LINES = ['E4', 'G4', 'B4', 'D5', 'F5'];
        var LEDGER_LINE_NOTES = ['C4', 'A5'];

        var verticalGridKeys = [
          81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60
        ];

        // Highest number of notes that can fit on the staff at any given time.
        var MAXIMUM_NOTES_POSSIBLE = 8;

        var noteChoicesElt = element.find('.oppia-music-input-note-choices');
        var staffContainerElt = element.find('.oppia-music-input-staff');

        // Staff has to be reinitialized every time that the staff is resized or
        // displayed. The staffContainerElt and all subsequent measurements
        // must be recalculated in order for the grid to work properly.
        scope.reinitStaff = function() {
          $('.oppia-music-input-valid-note-area').css('visibility', 'hidden');
          setTimeout(function() {
            $('.oppia-music-input-valid-note-area').css(
              'visibility', 'visible');
            scope.init();
          }, 20);
        };

        // When page is in the smaller one card format, reinitialize staff after
        // the user navigates to the Interaction Panel. Otherwise the dimensions
        // for the staff will be incorrectly calculated.
        scope.$on('showInteraction', function() {
          scope.reinitStaff();
        });

        // Creates draggable notes and droppable staff.
        scope.init = function() {
          scope.CONTAINER_WIDTH = staffContainerElt.width();
          scope.CONTAINER_HEIGHT = 0.2 * scope.CONTAINER_WIDTH;

          // The grid rectangle dimensions defining the grid which the notes
          // fall on.
          scope.HORIZONTAL_GRID_SPACING = scope.CONTAINER_WIDTH /
            (MAXIMUM_NOTES_POSSIBLE + 1);

          scope.VERTICAL_GRID_SPACING = scope.CONTAINER_HEIGHT /
            verticalGridKeys.length;

          staffTop = computeStaffTop();
          staffBottom = computeStaffBottom();

          // The farthest edge of the staff. If a note is placed beyond this
          // position, it will be discarded.
          RIGHT_EDGE_OF_STAFF_POSITION =
            element.find('.oppia-music-input-valid-note-area').width();

          clearNotesFromStaff();
          initPalette();

          clearDroppableStaff();
          buildDroppableStaff();

          repaintNotes();
        };

        // Initial notes are placed on the staff at the
        // start of the exploration and can be removed by the learner.
        var initializeNoteSequence = function(initialNotesToAdd) {
          for (var i = 0; i < initialNotesToAdd.length; i++) {
            var initialNote = _convertReadableNoteToNote(initialNotesToAdd[i]);
            initialNote.noteId = scope.generateNoteId();
            initialNote.noteStart = {
              num: i,
              den: 1
            };
            scope._addNoteToNoteSequence(initialNote);
          }
        };

        // Gets the staff top by getting the first staff line's position and
        // subtracting one vertical grid space from it.
        var computeStaffTop = function() {
          return (
            getStaffLinePositions()[verticalGridKeys[0]] -
            scope.VERTICAL_GRID_SPACING
          );
        };

        // Gets the staff bottom position by adding the staff top position value
        // with the total sum of all the vertical grid spaces (staff lines).
        var computeStaffBottom = function() {
          return computeStaffTop() + (
            scope.VERTICAL_GRID_SPACING * verticalGridKeys.length);
        };

        // Removes all notes from staff.
        var clearNotesFromStaff = function() {
          element.find('.oppia-music-input-note-choices div').remove();
        };

        // Removes all droppable staff lines.
        var clearDroppableStaff = function() {
          element.find('.oppia-music-input-staff div').remove();
        };

        // Returns an Object containing the baseNoteMidiValues (81, 79, 77...)
        // as keys and the vertical positions of the staff lines as values.
        var getStaffLinePositions = function() {
          var staffLinePositionsArray = [];
          var staffLinePositions = {};
          element.find(
            '.oppia-music-input-staff div.oppia-music-staff-position').each(
            function() {
              staffLinePositionsArray.push($(this).position().top);
            });
          for (var i = 0; i < staffLinePositionsArray.length; i++) {
            staffLinePositions[verticalGridKeys[i]] = (
              staffLinePositionsArray[i]);
          }
          return staffLinePositions;
        };

        // Creates the notes and helper-clone notes for the noteChoices div.
        var initPalette = function() {
          var noteChoicesDiv = element.find('.oppia-music-input-note-choices');
          var validNoteArea = element.find(
            '.oppia-music-input-valid-note-area');
          for (var i = 0; i < NOTE_TYPES.length; i++) {
            var innerDiv = $('<div></div>')
              .data('noteType', NOTE_TYPES[i])
              .addClass(function() {
                if ($(this).data('noteType') === NOTE_TYPE_NATURAL) {
                  $(this).addClass('oppia-music-input-natural-note');
                }
              });
            if (scope.interactionIsActive) {
              innerDiv.draggable({
                // Keeps note from being placed on top of the clef.
                containment: validNoteArea,
                cursor: 'pointer',
                helper: 'clone',
                stack: '.oppia-music-input-note-choices div',
                grid: [scope.HORIZONTAL_GRID_SPACING, 1],
                stop: function(evt, ui) {
                  if (!isCloneOffStaff($(ui.helper))) {
                    // This makes the helper clone a new draggable note.
                    var helperClone = $(ui.helper)
                    // Retains original note type (e.g. natural, flat, sharp).
                      .data('noteType', $(this).data('noteType'))
                      .draggable({
                      // The leftPosBeforeDrag helps with the sorting of user
                      // sequence.
                        start: function() {
                          $(this).data(
                            'leftPosBeforeDrag', $(this).position().left);
                        },
                        containment: '.oppia-music-input-valid-note-area',
                        cursor: 'pointer',
                        grid: [scope.HORIZONTAL_GRID_SPACING, 1],
                        // Stops helper clone from being cloned again.
                        helper: 'original',
                        stack: '.oppia-music-input-note-choices div',
                        tolerance: 'intersect',
                        revert: function() {
                          var draggableOptions = $(this);
                          // If note is out of droppable or off staff,
                          // remove it.
                          if (isCloneOffStaff(draggableOptions)) {
                            scope._removeNotesFromNoteSequenceWithId(
                              draggableOptions.data('noteId'));
                            scope._sortNoteSequence();
                            draggableOptions.remove();
                          }
                        }
                      });
                  }
                }
              });
            }
            noteChoicesDiv.append(innerDiv);
          }
        };

        var repaintNotes = function() {
          var noteChoicesDiv = element.find('.oppia-music-input-note-choices');

          for (var i = 0; i < scope.noteSequence.length; i++) {
            var innerDiv = $('<div></div>')
              .data('noteType', NOTE_TYPE_NATURAL)
              .data('noteId', scope.noteSequence[i].note.noteId)
              .addClass('oppia-music-input-natural-note')
              .addClass('oppia-music-input-on-staff')
              // Position notes horizontally by their noteStart positions and
              // vertically by the midi value they hold.
              .css({
                top:
                  getVerticalPosition(
                    scope.noteSequence[i].note.baseNoteMidiNumber) -
                  scope.VERTICAL_GRID_SPACING / 2.0,
                left:
                  getHorizontalPosition(getNoteStartAsFloat(
                    scope.noteSequence[i].note)),
                position: 'absolute'
              });
            if (scope.interactionIsActive) {
              innerDiv.draggable({
                // Keeps note from being placed on top of the clef.
                containment: '.oppia-music-input-valid-note-area',
                cursor: 'pointer',
                stack: '.oppia-music-input-note-choices div',
                grid: [scope.HORIZONTAL_GRID_SPACING, 1],
                start: function() {
                  $(this).data('leftPosBeforeDrag', $(this).position().left);
                },
                revert: function() {
                  var draggableOptions = $(this);
                  // If note is out of droppable or off staff, remove it.
                  if (isCloneOffStaff(draggableOptions)) {
                    scope._removeNotesFromNoteSequenceWithId(
                      draggableOptions.data('noteId'));
                    scope._sortNoteSequence();
                    draggableOptions.remove();
                  }
                }
              });
            }
            noteChoicesDiv.append(innerDiv);
          }
          repaintLedgerLines();
        };

        // Creates a staff of droppable lines.
        var buildDroppableStaff = function() {
          var lineValues = Object.keys(NOTE_NAMES_TO_MIDI_VALUES);
          for (var i = 0; i < lineValues.length; i++) {
            var staffLineDiv = $('<div></div>')
              .addClass('oppia-music-staff-position')
              .css('height', scope.VERTICAL_GRID_SPACING)
              .data('lineValue', lineValues[i])
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
                      noteId = scope.generateNoteId();
                      $(ui.helper).data('noteId', noteId);
                    }
                    drawLedgerLine(topPos, leftPos, lineValue, noteId);
                  }
                },
                out: function() {
                  // Removes a ledger line when note is dragged out of
                  // droppable.
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
                    noteId = scope.generateNoteId();
                    $(ui.helper).data('noteId', noteId);
                  }

                  // Creates a note object.
                  var note = {
                    baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[lineValue],
                    offset: parseInt(noteType, 10),
                    noteId: noteId
                  };

                  // When a note is moved, its previous state must be removed
                  // from the noteSequence. Otherwise, the sequence would
                  // erroneously hold notes that have been moved to other
                  // positions. Also this allows an on-staff note's position
                  // to be freed up if it is moved.
                  scope._removeNotesFromNoteSequenceWithId(note.noteId);

                  // Makes sure that a note can move vertically on it's
                  // position.
                  if (startPos !== leftPos) {
                    // Moves the note to the next available spot on the staff.
                    // If the staff is full, note is moved off staff,
                    // and thus removed.
                    while (checkIfNotePositionTaken(leftPos)) {
                      leftPos += scope.HORIZONTAL_GRID_SPACING;
                    }
                    $(ui.helper).css({
                      top: topPos,
                      left: leftPos
                    });

                    if (Math.floor(leftPos) > Math.floor(
                      getHorizontalPosition(MAXIMUM_NOTES_POSSIBLE - 1))) {
                      $(ui.helper).remove();
                      repaintLedgerLines();
                      return;
                    }
                  }

                  // Adjusts note so it is right on top of the staff line by
                  // calculating half of the VERTICAL_GRID_SPACING and
                  // subtracting that from its current top Position.
                  $(ui.helper).css({
                    top: topPos - (scope.VERTICAL_GRID_SPACING / 2.0)
                  });

                  // Add noteStart property to note object.
                  if (getNoteStartFromLeftPos(leftPos) !== undefined) {
                    note.noteStart =
                      getNoteStartFromLeftPos(leftPos).note.noteStart;
                  } else {
                    repaintLedgerLines();
                    return;
                  }

                  scope._addNoteToNoteSequence(note);
                  scope._sortNoteSequence();

                  // Sounds the note when it is dropped onto staff.
                  playSequence([[_convertNoteToMidiPitch(note)]]);
                  $(ui.helper).addClass('oppia-music-input-on-staff');

                  repaintLedgerLines();
                }
              });

            element.find('.oppia-music-input-staff').append(staffLineDiv);

            if (i === 0) {
              scope.topPositionForCenterOfTopStaffLine =
                $(staffLineDiv).position().top + scope.VERTICAL_GRID_SPACING;
            }

            var noteName = lineValues[i];

            // Check if noteName is a valid staff line and if so, paint staff
            // line.
            if (NOTES_ON_LINES.indexOf(noteName) !== -1) {
              staffLineDiv.append(
                $('<div></div>')
                  // Positions and centers the staff line directly on top of its
                  // associated droppable.
                  .css('margin-top', scope.VERTICAL_GRID_SPACING / 2.5)
                  .addClass('oppia-music-staff-line')
              );
            }
          }
        };

        // When compareNoteStarts(a, b) returns less than 0, a is less than b.
        // When compareNoteStarts(a, b) returns 0, a is equal to b.
        // When compareNoteStarts(a, b) returns greater than 0, a is greater
        //   than b.
        var compareNoteStarts = function(a, b) {
          if (a.note.noteStart && b.note.noteStart) {
            return (a.note.noteStart.num * b.note.noteStart.den -
                    a.note.noteStart.den * b.note.noteStart.num) /
                   (a.note.noteStart.den * b.note.noteStart.den);
          }
        };

        // If a note position is taken, return true,
        // otherwise the position is available
        var checkIfNotePositionTaken = function(leftPos) {
          if (getNoteStartFromLeftPos(leftPos)) {
            var newNoteToCheck = getNoteStartFromLeftPos(leftPos);
            if (newNoteToCheck.note.noteStart !== undefined) {
              for (var i = 0; i < scope.noteSequence.length; i++) {
                var noteComparison = compareNoteStarts(
                  scope.noteSequence[i], newNoteToCheck);
                if (noteComparison === 0) {
                  return true;
                }
              }
              return false;
            }
          }
          return false;
        };

        // Converts a note's leftPosition to a noteStart object by checking if
        // leftPos is close to available horizontal grid position. If there is
        // not a close match, return undefined.
        var getNoteStartFromLeftPos = function(leftPos) {
          for (var i = 0; i < MAXIMUM_NOTES_POSSIBLE; i++) {
            // If the difference between leftPos and a horizontalGrid Position
            // is less than 2, then they are close enough to set a position.
            // This gives some wiggle room for rounding differences.
            if (Math.abs(leftPos - getHorizontalPosition(i)) < 2) {
              var note = {};
              note.noteStart = {
                num: i,
                den: 1
              };
              return {
                note: note
              };
            }
          }
          return undefined;
        };

        var getNoteStartAsFloat = function(note) {
          return note.noteStart.num / note.noteStart.den;
        };

        // Clear noteSequence values and remove all notes
        // and Ledger Lines from the staff.
        scope.clearSequence = function() {
          scope.noteSequence = [];
          element.find('.oppia-music-input-on-staff').remove();
          element.find('.oppia-music-input-ledger-line').remove();
        };

        // Converts the midiValue of a droppable line that a note is on
        // into a top position.
        var getVerticalPosition = function(baseNoteMidiNumber) {
          return getStaffLinePositions()[baseNoteMidiNumber];
        };

        /**
         * Gets a horizontal grid position based on the position of note-choices
         * div. '.oppia-music-input-note-choices div:first-child' (the note that
         * gets cloned to create all other subsequent notes) is the last
         * horizontal position, so to determine the others values, we multiply
         * the MAXIMUM_NOTES_POSSIBLE that will fit on the staff by the
         * scope.HORIZONTAL_GRID_SPACING and subtract that from the last
         * Horizontal Position value and return the result.
         */
        var getHorizontalPosition = function(noteStartAsFloat) {
          var lastHorizontalPositionOffset = element.find(
            '.oppia-music-input-note-choices div:first-child').position().left;
          var leftOffset =
            lastHorizontalPositionOffset - ((MAXIMUM_NOTES_POSSIBLE - 1) *
                            scope.HORIZONTAL_GRID_SPACING);
          return leftOffset + (
            noteStartAsFloat * scope.HORIZONTAL_GRID_SPACING);
        };

        var isCloneOffStaff = function(helperClone) {
          return (!(helperClone.position().top > staffTop &&
                  helperClone.position().top < staffBottom));
        };

        var isLedgerLineNote = function(lineValue) {
          return LEDGER_LINE_NOTES.indexOf(lineValue) !== -1;
        };

        var drawLedgerLine = function(topPos, leftPos) {
          var ledgerLineDiv = $('<div></div>')
            .addClass(
              'oppia-music-input-ledger-line oppia-music-input-natural-note')
            .droppable({
              accept: '.oppia-music-input-note-choices div',
              // When a ledgerLine note is moved out of its droppable,
              // remove ledger line.
              out: function() {
                $(this).hide();
              },
              hoverClass: 'oppia-music-input-hovered',
              containment: '.oppia-music-input-valid-note-area'
            })
            // Adjust ledger line to be centered with the note.
            .css({
              left: leftPos - 1,
              // 0.4 is a little less than half to allow for the height of the
              // ledger line when considering its placement.
              top: topPos + scope.VERTICAL_GRID_SPACING * 0.4
            });

          element.find('.oppia-music-input-staff').append(ledgerLineDiv);
        };

        var repaintLedgerLines = function() {
          for (var i = 0; i < scope.noteSequence.length; i++) {
            var note = scope.noteSequence[i].note;
            var lineValue = _getCorrespondingNoteName(note.baseNoteMidiNumber);
            if (isLedgerLineNote(lineValue)) {
              drawLedgerLine(
                getVerticalPosition(note.baseNoteMidiNumber),
                getHorizontalPosition(getNoteStartAsFloat(note)),
                lineValue,
                note.noteId
              );
            }
          }
        };

        var _getCorrespondingNoteName = function(midiNumber) {
          var correspondingNoteName = null;
          for (var noteName in NOTE_NAMES_TO_MIDI_VALUES) {
            if (NOTE_NAMES_TO_MIDI_VALUES[noteName] === midiNumber) {
              correspondingNoteName = noteName;
              break;
            }
          }
          if (correspondingNoteName === null) {
            console.error('Invalid MIDI pitch: ' + midiNumber);
          }
          return correspondingNoteName;
        };

        /*
         * Returns a note object with a readable note name, such as Eb5, A5 or
         * F#4, given a note object with baseNoteMidiNumber and sharp/flat
         * offset properties. For example, if note.baseNoteMidiNumber = 64 and
         * note.offset = -1, this will return {'readableNoteName': 'Eb4'}
         * (since 64 is the baseNoteMidiNumber for 'E', and -1 indicates a
         * flat).
         */
        var _convertNoteToReadableNote = function(note) {
          if (note.offset !== -1 && note.offset !== 0 && note.offset !== 1) {
            console.error('Invalid note offset: ' + note.offset);
          }

          var correspondingNoteName =
            _getCorrespondingNoteName(note.baseNoteMidiNumber);

          var accidental = (note.offset === 1 ? '#' :
            note.offset === 0 ? '' : 'b');

          return {
            readableNoteName:
              correspondingNoteName[0] + accidental + correspondingNoteName[1]
          };
        };

        /*
         * Returns a note object with a baseNoteMidiNumber and an
         * offset property, given a note object with a readableNoteName
         * property. For example, if note.readableNoteName = 'Eb4' this will
         * return {'baseNoteMidiNumber': 64, 'offset': -1} (since 64 is the
         * baseNoteMidiNumber for 'E', and -1 indicates a flat).
         */
        var _convertReadableNoteToNote = function(readableNote) {
          var readableNoteName = readableNote.readableNoteName;
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
              baseNoteMidiNumber: NOTE_NAMES_TO_MIDI_VALUES[
                readableNoteName[0] + readableNoteName[2]],
              offset: offset
            };
          } else {
            // This is not a valid readableNote.
            console.error('Invalid readable note: ' + readableNote);
          }
        };

        // For each note in a sequence, add a noteDuration property.
        // TODO (wagnerdmike) - add more options for note durations.
        var _makeAllNotesHaveDurationOne = function(noteArray) {
          for (var i = 0; i < noteArray.length; i++) {
            noteArray[i].noteDuration = {
              num: 1,
              den: 1
            };
          }
          return noteArray;
        };

        scope.submitAnswer = function() {
          var readableSequence = [];
          for (var i = 0; i < scope.noteSequence.length; i++) {
            readableSequence.push(
              _convertNoteToReadableNote(scope.noteSequence[i].note));
          }
          readableSequence = _makeAllNotesHaveDurationOne(readableSequence);
          CurrentInteractionService.onSubmit(
            readableSequence, musicNotesInputRulesService);
        };

        CurrentInteractionService.registerCurrentInteraction(
          scope.submitAnswer);

        /** *****************************************************************
         * Functions involving MIDI playback.
         ******************************************************************/

        scope.playSequenceToGuess = function() {
          var noteSequenceToGuess = [];
          for (var i = 0; i < scope.sequenceToGuess.length; i++) {
            noteSequenceToGuess.push(
              _convertReadableNoteToNote(
                scope.sequenceToGuess[i]));
          }
          playSequence(convertSequenceToGuessToMidiSequence(
            noteSequenceToGuess));
        };

        scope.playCurrentSequence = function() {
          playSequence(convertNoteSequenceToMidiSequence(scope.noteSequence));
        };

        // Takes an input > 0, converts to a noteStart object and returns a
        // float representation of the noteStart position.
        var getNoteStart = function(noteIndex) {
          return getNoteStartAsFloat({
            noteStart: {
              num: noteIndex,
              den: 1
            }
          });
        };

        // Input is a midiSequence, which is an array of arrays, in the form of
        // [[72], [62], [67, 71, 74]]. An inner array with more than one value
        // is treated like a chord and all its values are played back
        // simultaneously.
        var playSequence = function(midiSequence) {
          var notes = [];
          for (var i = 0; i < midiSequence.length; i++) {
            for (var j = 0; j < midiSequence[i].length; j++) {
              notes.push({
                midiValue: midiSequence[i][j],
                duration: 1.0,
                start: getNoteStart(i)
              });
            }
          }

          musicPhrasePlayerService.playMusicPhrase(notes);
        };

        // A MIDI pitch is the baseNoteMidiNumber of the note plus the offset.
        var _convertNoteToMidiPitch = function(note) {
          return note.baseNoteMidiNumber + note.offset;
        };

        // Return the MIDI value for each note in the sequence.
        // TODO (wagnerdmike) - add chord functionality.
        var convertSequenceToGuessToMidiSequence = function(sequence) {
          var midiSequence = [];
          for (var i = 0; i < sequence.length; i++) {
            if (sequence[i].hasOwnProperty('baseNoteMidiNumber')) {
              midiSequence.push([_convertNoteToMidiPitch(sequence[i])]);
            } else {
              console.error('Invalid note: ' + sequence[i]);
            }
          }
          return midiSequence;
        };

        // Return the MIDI value for each note in the sequence.
        // TODO (wagnerdmike) - add chord functionality.
        var convertNoteSequenceToMidiSequence = function(sequence) {
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
        };

        // Initialization code.

        initializeNoteSequence(scope.initialSequence);
        scope.init();

        // Sets grid positions, displays the staff and note,
        // and then initializes the view after staff has loaded.
        $(document).ready(function() {
          scope.reinitStaff();
        });
      }
    };
  }
]);

oppia.directive('oppiaResponseMusicNotesInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/MusicNotesInput/directives/' +
        'music_notes_input_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        _notes = [];
        for (var i = 0; i < _answer.length; i++) {
          if (_answer[i].readableNoteName) {
            _notes.push(_answer[i].readableNoteName);
          }
        }

        if (_notes.length > 0) {
          $scope.displayedAnswer = _notes.join(', ');
        } else {
          $scope.displayedAnswer = 'No answer given.';
        }
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseMusicNotesInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/MusicNotesInput/directives/' +
        'music_notes_input_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        var _notes = [];
        for (var i = 0; i < _answer.length; i++) {
          if (_answer[i].readableNoteName) {
            _notes.push(_answer[i].readableNoteName);
          }
        }

        if (_notes.length > 0) {
          $scope.displayedAnswer = _notes.join(', ');
        } else {
          $scope.displayedAnswer = 'No answer given.';
        }
      }]
    };
  }
]);

oppia.factory('musicNotesInputRulesService', [
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
        return _convertSequenceToMidi(answer).length > inputs.x;
      },
      // TODO(wxy): validate that inputs.a <= inputs.b
      HasLengthInclusivelyBetween: function(answer, inputs) {
        var answerLength = _convertSequenceToMidi(answer).length;
        return length >= inputs.a && length <= inputs.b;
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
