// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the music notes input interaction component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import {InteractionAnswer, MusicNotesAnswer} from 'interactions/answer-defs';
import {
  MusicNotesInputCustomizationArgs,
  ReadableMusicNote,
} from 'interactions/customization-args-defs';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {InteractionsExtensionsConstants} from 'interactions/interactions-extension.constants';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {MusicNotesInputRulesService} from './music-notes-input-rules.service';
import {MusicPhrasePlayerService} from './music-phrase-player.service';

interface MusicNote {
  baseNoteMidiNumber: number;
  offset: number;
  noteId: string;
  noteStart: {
    num: number;
    den: number;
  };
}

interface NoteSequence {
  note: MusicNote;
}

interface Sequence {
  value: ReadableMusicNote[];
}

@Component({
  selector: 'oppia-interactive-music-notes-input',
  templateUrl: './music-notes-input-interaction.component.html',
})
export class MusicNotesInputComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() lastAnswer!: string;
  @Input() sequenceToGuessWithValue!: string;
  @Input() initialSequenceWithValue!: string;
  sequenceToGuess!: Sequence;
  initialSequence!: string | Sequence;
  staffTop!: number;
  staffBottom!: number;
  readableSequence!: string;
  CONTAINER_WIDTH!: number;
  CONTAINER_HEIGHT!: number;
  HORIZONTAL_GRID_SPACING!: number;
  VERTICAL_GRID_SPACING!: number;
  topPositionForCenterOfTopStaffLine!: number;
  interactionIsActive = false;
  directiveSubscriptions = new Subscription();
  noteSequence: NoteSequence[] = [];
  _currentNoteId = 0;
  NOTE_TYPE_NATURAL = 0;
  // TODO(#15177): Add more features to Music-Notes-Input Interaction
  // More notes types will be added to NOTE_TYPES.
  NOTE_TYPES = [this.NOTE_TYPE_NATURAL];
  NOTES_ON_LINES = ['E4', 'G4', 'B4', 'D5', 'F5'];
  LEDGER_LINE_NOTES = ['C4', 'A5'];
  verticalGridKeys = [81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60];
  SOUNDFONT_URL = '/third_party/static/midi-js-c26ebb/examples/soundfont/';
  // Highest number of notes that can fit on the staff at any given time.
  MAXIMUM_NOTES_POSSIBLE = 8;
  NOTE_NAMES_TO_MIDI_VALUES =
    InteractionsExtensionsConstants.NOTE_NAMES_TO_MIDI_VALUES;

  staffContainerElt: JQuery<HTMLElement>;

  constructor(
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private playerPositionService: PlayerPositionService,
    private currentInteractionService: CurrentInteractionService,
    private musicNotesInputRulesService: MusicNotesInputRulesService,
    private musicPhrasePlayerService: MusicPhrasePlayerService,
    private alertsService: AlertsService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  private _getAttributes() {
    return {
      sequenceToGuessWithValue: this.sequenceToGuessWithValue,
      initialSequenceWithValue: this.initialSequenceWithValue,
    };
  }

  ngOnInit(): void {
    const {sequenceToGuess, initialSequence} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'MusicNotesInput',
        this._getAttributes()
      ) as MusicNotesInputCustomizationArgs;

    this.sequenceToGuess = sequenceToGuess;
    this.interactionIsActive = this.lastAnswer === null;

    this.initialSequence = this.interactionIsActive
      ? initialSequence
      : this.lastAnswer;
    // TODO(#14340): Remove some usages of jQuery from the codebase.
    this.staffContainerElt = $(
      this.elementRef.nativeElement.querySelectorAll('.oppia-music-input-staff')
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(() => {
        this.interactionIsActive = false;
        this.initialSequence = this.lastAnswer;
        this.reinitStaff();
      })
    );

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(),
      null
    );
    // Initialization code.
    this.initializeNoteSequence(this.initialSequence as Sequence);
    this.init();
  }

  ngAfterViewInit(): void {
    // Sets grid positions, displays the staff and note,
    // and then initializes the view after staff has loaded.
    this.reinitStaff();
  }

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
  _addNoteToNoteSequence(note: MusicNote): void {
    this.noteSequence.push({
      note: note,
    });
  }

  // Remove a specific note with given noteId from noteSequence. If given
  // noteId is not in noteSequence, nothing will be removed.
  _removeNotesFromNoteSequenceWithId(noteId: string): void {
    for (let i = 0; i < this.noteSequence.length; i++) {
      if (this.noteSequence[i].note.noteId === noteId) {
        this.noteSequence.splice(i, 1);
      }
    }
  }

  // Sorts noteSequence elements according to the return value of the
  // compareNoteStarts function.
  _sortNoteSequence(): void {
    this.noteSequence.sort(this.compareNoteStarts);
  }

  /**
   * Counter to create unique id for each note dropped on staff.
   */
  generateNoteId(): string {
    this._currentNoteId += 1;
    let nodeId = 'note_id_' + (this._currentNoteId - 1);
    return nodeId;
  }

  // Staff has to be reinitialized every time that the staff is resized or
  // displayed. The staffContainerElt and all subsequent measurements
  // must be recalculated in order for the grid to work properly.
  // TODO(#14340): Remove some usages of jQuery from the codebase.
  reinitStaff(): void {
    var elem = document.querySelector('.oppia-music-input-valid-note-area');

    if (elem) {
      this.renderer.setStyle(elem, 'visibility', 'hidden');

      setTimeout(() => {
        this.renderer.setStyle(elem, 'visibility', 'visible');
        this.init();
      }, 20);
    }
  }

  init(): void {
    this.CONTAINER_WIDTH = this.staffContainerElt.width();
    this.CONTAINER_HEIGHT = 0.2 * this.CONTAINER_WIDTH;

    // The grid rectangle dimensions defining the grid which the notes
    // fall on.
    this.HORIZONTAL_GRID_SPACING =
      this.CONTAINER_WIDTH / (this.MAXIMUM_NOTES_POSSIBLE + 1);

    this.VERTICAL_GRID_SPACING =
      this.CONTAINER_HEIGHT / this.verticalGridKeys.length;

    this.clearNotesFromStaff();
    this.initPalette();

    this.clearDroppableStaff();
    this.buildDroppableStaff();

    this.repaintNotes();
  }

  // Initial notes are placed on the staff at the
  // start of the exploration and can be removed by the learner.
  initializeNoteSequence(initialNotesToAdd: Sequence): void {
    for (let i = 0; i < initialNotesToAdd.value.length; i++) {
      let {baseNoteMidiNumber, offset} = this._convertReadableNoteToNote(
        initialNotesToAdd.value[i]
      );
      let initialNote = {
        baseNoteMidiNumber: baseNoteMidiNumber,
        offset: offset,
        noteId: this.generateNoteId(),
        noteStart: {
          num: i,
          den: 1,
        },
      };
      this._addNoteToNoteSequence(initialNote);
    }
  }

  // Removes all notes from staff.
  // TODO(#14340): Remove some usages of jQuery from the codebase.
  clearNotesFromStaff(): void {
    $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-note-choices div'
      )
    ).remove();
  }

  // Removes all droppable staff lines.
  // TODO(#14340): Remove some usages of jQuery from the codebase.
  clearDroppableStaff(): void {
    $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-staff div'
      )
    ).remove();
  }

  // Returns an Object containing the baseNoteMidiValues (81, 79, 77...)
  // as keys and the vertical positions of the staff lines as values.
  // TODO(#14340): Remove some usages of jQuery from the codebase.
  getStaffLinePositions(): Object {
    let staffLinePositionsArray = [];
    let staffLinePositions = {};
    let elements = $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-staff div.oppia-music-staff-position'
      )
    );
    elements.each((el, val) => {
      staffLinePositionsArray.push($(val).position().top);
    });
    for (let i = 0; i < staffLinePositionsArray.length; i++) {
      staffLinePositions[this.verticalGridKeys[i]] = staffLinePositionsArray[i];
    }
    return staffLinePositions;
  }

  // Creates the notes and helper-clone notes for the noteChoices div.
  // TODO(#14340): Remove some usages of jQuery from the codebase.
  initPalette(): void {
    let noteChoicesDiv = $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-note-choices'
      )
    );
    let validNoteArea = $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-valid-note-area'
      )
    );
    for (let i = 0; i < this.NOTE_TYPES.length; i++) {
      var addedClass = null;
      if (this.NOTE_TYPES[i] === this.NOTE_TYPE_NATURAL) {
        addedClass = 'oppia-music-input-natural-note';
      }
      var innerDiv = $(`<div class="${addedClass}"></div>`).data(
        'noteType',
        this.NOTE_TYPES[i]
      );
      if (this.interactionIsActive) {
        innerDiv.draggable({
          // Keeps note from being placed on top of the clef.
          containment: validNoteArea,
          cursor: 'pointer',
          helper: 'clone',
          stack: '.oppia-music-input-note-choices div',
          grid: [this.HORIZONTAL_GRID_SPACING, 1],
          stop: (evt, ui) => {
            if (!this.isCloneOffStaff($(ui.helper))) {
              // This makes the helper clone a new draggable note.
              $(ui.helper)
                // Retains original note type (e.g. natural, flat, sharp).
                .data('noteType', $(innerDiv).data('noteType'))
                .draggable({
                  // The leftPosBeforeDrag helps with the sorting of user
                  // sequence.
                  start: () => {
                    $(innerDiv).data(
                      'leftPosBeforeDrag',
                      $(innerDiv).position().left
                    );
                  },
                  containment: '.oppia-music-input-valid-note-area',
                  cursor: 'pointer',
                  grid: [this.HORIZONTAL_GRID_SPACING, 1],
                  // Stops helper clone from being cloned again.
                  helper: 'original',
                  stack: '.oppia-music-input-note-choices div',
                  tolerance: 'intersect',
                  revert: () => {
                    let draggableOptions = $(innerDiv);
                    // If note is out of droppable or off staff,
                    // remove it.
                    if (this.isCloneOffStaff(draggableOptions)) {
                      this._removeNotesFromNoteSequenceWithId(
                        draggableOptions.data('noteId')
                      );
                      this._sortNoteSequence();
                      draggableOptions.remove();
                    }
                  },
                });
            }
          },
        });
      }
      noteChoicesDiv.append(innerDiv);
    }
  }

  // TODO(#14340): Remove some usages of jQuery from the codebase.
  repaintNotes(): void {
    let noteChoicesDiv = $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-note-choices'
      )
    );
    let validNoteArea = $(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-valid-note-area'
      )
    );
    for (let i = 0; i < this.noteSequence.length; i++) {
      var innerDiv = $(
        '<div class="oppia-music-input-natural-note' +
          ' oppia-music-input-on-staff"></div>'
      )
        .data('noteType', this.NOTE_TYPE_NATURAL)
        .data('noteId', this.noteSequence[i].note.noteId)
        // Position notes horizontally by their noteStart positions and
        // vertically by the midi value they hold.
        .css({
          top:
            this.getVerticalPosition(
              this.noteSequence[i].note.baseNoteMidiNumber
            ) -
            this.VERTICAL_GRID_SPACING / 2.0,
          left: this.getHorizontalPosition(
            this.getNoteStartAsFloat(this.noteSequence[i].note)
          ),
          position: 'absolute',
        });
      if (this.interactionIsActive) {
        innerDiv.draggable({
          // Keeps note from being placed on top of the clef.
          containment: validNoteArea,
          cursor: 'pointer',
          stack: '.oppia-music-input-note-choices div',
          grid: [this.HORIZONTAL_GRID_SPACING, 1],
          start: () => {
            $(innerDiv).data('leftPosBeforeDrag', $(innerDiv).position().left);
          },
          revert: () => {
            let draggableOptions = $(innerDiv);
            // If note is out of droppable or off staff, remove it.
            if (this.isCloneOffStaff(draggableOptions)) {
              this._removeNotesFromNoteSequenceWithId(
                draggableOptions.data('noteId')
              );
              this._sortNoteSequence();
              draggableOptions.remove();
            }
          },
        });
      }
      noteChoicesDiv.append(innerDiv);
    }
    this.repaintLedgerLines();
  }

  buildDroppableStaff(): void {
    const lineValues = Object.keys(this.NOTE_NAMES_TO_MIDI_VALUES);
    const staffContainer = this.elementRef.nativeElement.querySelector(
      '.oppia-music-input-staff'
    );

    for (const lv of lineValues) {
      const staffLineDiv = this.renderer.createElement('div');
      this.renderer.addClass(staffLineDiv, 'oppia-music-staff-position');
      this.renderer.setStyle(
        staffLineDiv,
        'height',
        `${this.VERTICAL_GRID_SPACING}px`
      );
      staffLineDiv.dataset.lineValue = lv;

      staffLineDiv.addEventListener('dragenter', evt => {
        evt.preventDefault();
        const lineValue = staffLineDiv.dataset.lineValue!;
        if (this.isLedgerLineNote(Number(lineValue))) {
          const rect = (
            evt.currentTarget as HTMLElement
          ).getBoundingClientRect();
          this.drawLedgerLine(rect.top, (evt as DragEvent).clientX);
        }
      });

      staffLineDiv.addEventListener('dragleave', () => {
        this.hideLastLedgerLine();
      });

      staffLineDiv.addEventListener('dragover', evt => evt.preventDefault());

      staffLineDiv.addEventListener('drop', evt => {
        evt.preventDefault();
        this.hideLastLedgerLine();

        const dropEvent = evt as DragEvent;
        const draggedElt = document.getElementById(
          dropEvent.dataTransfer?.getData('text/plain')!
        );
        if (!draggedElt) return;

        const noteType = draggedElt.dataset.noteType;
        let noteId = draggedElt.dataset.noteId;
        if (!noteId) {
          noteId = this.generateNoteId();
          draggedElt.dataset.noteId = noteId;
        }

        const leftPos = dropEvent.clientX;
        const topPos = (evt.currentTarget as HTMLElement).offsetTop;
        const lineValue = staffLineDiv.dataset.lineValue!;
        const baseNoteMidiNumber =
          this.NOTE_NAMES_TO_MIDI_VALUES[Number(lineValue)];

        const noteObj = {
          baseNoteMidiNumber,
          offset: Number.isFinite(+noteType) ? parseInt(noteType!, 10) : 0,
          noteId,
          noteStart:
            this.getNoteStartFromLeftPos(leftPos)?.note.noteStart ?? null,
        };

        this._removeNotesFromNoteSequenceWithId(noteId);
        this._addNoteToNoteSequence(noteObj);
        this._sortNoteSequence();

        if (!draggedElt.classList.contains('oppia-music-input-on-staff')) {
          this.renderer.setStyle(draggedElt, 'position', 'absolute');
        }
        this.renderer.setStyle(draggedElt, 'left', `${leftPos}px`);
        this.renderer.setStyle(
          draggedElt,
          'top',
          `${topPos - this.VERTICAL_GRID_SPACING / 2}px`
        );
        this.renderer.addClass(draggedElt, 'oppia-music-input-on-staff');

        this.playSequence([[this._convertNoteToMidiPitch(noteObj)]]);
        this.repaintLedgerLines();
      });

      if (this.NOTES_ON_LINES.includes(lv)) {
        const innerLine = this.renderer.createElement('div');
        this.renderer.addClass(innerLine, 'oppia-music-staff-line');
        this.renderer.setStyle(
          innerLine,
          'margin-top',
          `${this.VERTICAL_GRID_SPACING / 2.5}px`
        );
        this.renderer.appendChild(staffLineDiv, innerLine);
      }

      this.renderer.appendChild(staffContainer, staffLineDiv);

      if (lv === lineValues[0]) {
        const topPos = (staffLineDiv as HTMLElement).offsetTop;
        this.topPositionForCenterOfTopStaffLine =
          topPos + this.VERTICAL_GRID_SPACING;
      }
    }
  }

  hideLastLedgerLine(): void {
    const all = Array.from(
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-ledger-line'
      )
    ) as HTMLElement[];
    if (all.length) {
      const last = all[all.length - 1];
      this.renderer.setStyle(last, 'display', 'none');
    }
  }

  // When compareNoteStarts(a, b) returns less than 0, a is less than b.
  // When compareNoteStarts(a, b) returns 0, a is equal to b.
  // When compareNoteStarts(a, b) returns greater than 0, a is greater
  //   than b.
  compareNoteStarts(a: {note: MusicNote}, b: {note: MusicNote}): number {
    if (a.note.noteStart && b.note.noteStart) {
      return (
        (a.note.noteStart.num * b.note.noteStart.den -
          a.note.noteStart.den * b.note.noteStart.num) /
        (a.note.noteStart.den * b.note.noteStart.den)
      );
    }
  }

  // If a note position is taken, return true,
  // otherwise the position is available.
  checkIfNotePositionTaken(leftPos: number): boolean {
    if (this.getNoteStartFromLeftPos(leftPos)) {
      let newNoteToCheck = this.getNoteStartFromLeftPos(leftPos);
      if (newNoteToCheck.note.noteStart !== undefined) {
        for (let i = 0; i < this.noteSequence.length; i++) {
          let noteComparison = this.compareNoteStarts(
            this.noteSequence[i],
            newNoteToCheck
          );
          if (noteComparison === 0) {
            return true;
          }
        }
        return false;
      }
    }
    return false;
  }

  // Converts a note's leftPosition to a noteStart object by checking if
  // leftPos is close to available horizontal grid position. If there is
  // not a close match, return undefined.
  getNoteStartFromLeftPos(leftPos: number): NoteSequence | undefined {
    for (let i = 0; i < this.MAXIMUM_NOTES_POSSIBLE; i++) {
      // If the difference between leftPos and a horizontalGrid Position
      // is less than 2, then they are close enough to set a position.
      // This gives some wiggle room for rounding differences.
      if (Math.abs(leftPos - this.getHorizontalPosition(i)) < 2) {
        let note = {
          noteStart: {
            num: i,
            den: 1,
          },
        } as MusicNote;
        return {
          note: note,
        };
      }
    }
    return undefined;
  }

  getNoteStartAsFloat(note: MusicNote): number {
    return note.noteStart.num / note.noteStart.den;
  }

  // Clear noteSequence values and remove all notes
  // and Ledger Lines from the staff.
  clearSequence(): void {
    this.noteSequence = [];
    const notesOnStaff = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-on-staff'
    );
    notesOnStaff.forEach(note => note.remove());
    const ledgerLines = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-ledger-line'
    );
    ledgerLines.forEach(line => line.remove());
  }

  // Converts the midiValue of a droppable line that a note is on
  // into a top position.
  getVerticalPosition(baseNoteMidiNumber: number): number {
    return this.getStaffLinePositions()[baseNoteMidiNumber];
  }

  /**
   * Gets a horizontal grid position based on the position of note-choices
   * div. '.oppia-music-input-note-choices div:first-child' (the note that
   * gets cloned to create all other subsequent notes) is the last
   * horizontal position, so to determine the others values, we multiply
   * the  that will fit on the staff by the
   * this.HORIZONTAL_GRID_SPACING and subtract that from the last
   * Horizontal Position value and return the result.
   */
  getHorizontalPosition(noteStartAsFloat: number): number {
    let lastHorizontalPositionOffset = $(
      this.elementRef.nativeElement.querySelector(
        '.oppia-music-input-note-choices div:first-child'
      )
    ).position().left;
    let leftOffset =
      lastHorizontalPositionOffset -
      (this.MAXIMUM_NOTES_POSSIBLE - 1) * this.HORIZONTAL_GRID_SPACING;
    return leftOffset + noteStartAsFloat * this.HORIZONTAL_GRID_SPACING;
  }

  isCloneOffStaff(helperClone: JQLite | JQuery<this>): boolean {
    return !(
      helperClone.position().top > this.staffTop &&
      helperClone.position().top < this.staffBottom
    );
  }

  isLedgerLineNote(lineValue: string): boolean {
    return this.LEDGER_LINE_NOTES.indexOf(lineValue) !== -1;
  }

  drawLedgerLine(topPos: number, leftPos: number): void {
    const ledgerLineDiv = this.renderer.createElement('div');
    this.renderer.addClass(ledgerLineDiv, 'oppia-music-input-ledger-line');
    this.renderer.addClass(ledgerLineDiv, 'oppia-music-input-natural-note');

    this.renderer.setStyle(ledgerLineDiv, 'position', 'absolute');
    this.renderer.setStyle(ledgerLineDiv, 'left', `${leftPos - 1}px`);
    this.renderer.setStyle(
      ledgerLineDiv,
      'top',
      `${topPos + this.VERTICAL_GRID_SPACING * 0.4}px`
    );
    ledgerLineDiv.addEventListener('dragleave', () => {
      this.renderer.setStyle(ledgerLineDiv, 'display', 'none');
    });
    const staffContainer = this.elementRef.nativeElement.querySelector(
      '.oppia-music-input-staff'
    );
    if (staffContainer) {
      this.renderer.appendChild(staffContainer, ledgerLineDiv);
    }
  }

  repaintLedgerLines(): void {
    for (let i = 0; i < this.noteSequence.length; i++) {
      let note = this.noteSequence[i].note;
      let lineValue = this._getCorrespondingNoteName(note.baseNoteMidiNumber);
      if (this.isLedgerLineNote(lineValue)) {
        this.drawLedgerLine(
          this.getVerticalPosition(note.baseNoteMidiNumber),
          this.getHorizontalPosition(this.getNoteStartAsFloat(note))
        );
      }
    }
  }

  _getCorrespondingNoteName(midiNumber: string | number): string {
    let correspondingNoteName = null;
    for (let noteName in this.NOTE_NAMES_TO_MIDI_VALUES) {
      if (this.NOTE_NAMES_TO_MIDI_VALUES[noteName] === midiNumber) {
        correspondingNoteName = noteName;
        break;
      }
    }
    if (correspondingNoteName === null) {
      console.error('Invalid MIDI pitch: ' + midiNumber);
    }
    return correspondingNoteName;
  }

  /*
   * Returns a note object with a readable note name, such as Eb5, A5 or
   * F#4, given a note object with baseNoteMidiNumber and sharp/flat
   * offset properties. For example, if note.baseNoteMidiNumber = 64 and
   * note.offset = -1, this will return {'readableNoteName': 'Eb4'}
   * (since 64 is the baseNoteMidiNumber for 'E', and -1 indicates a
   * flat).
   */
  _convertNoteToReadableNote(note: MusicNote): ReadableMusicNote {
    if (note.offset !== -1 && note.offset !== 0 && note.offset !== 1) {
      console.error('Invalid note offset: ' + note.offset);
    }

    let correspondingNoteName = this._getCorrespondingNoteName(
      note.baseNoteMidiNumber
    );

    let accidental = note.offset === 1 ? '#' : note.offset === 0 ? '' : 'b';

    return {
      readableNoteName:
        correspondingNoteName[0] + accidental + correspondingNoteName[1],
    } as ReadableMusicNote;
  }

  /*
   * Returns a note object with a baseNoteMidiNumber and an
   * offset property, given a note object with a readableNoteName
   * property. For example, if note.readableNoteName = 'Eb4' this will
   * return {'baseNoteMidiNumber': 64, 'offset': -1} (since 64 is the
   * baseNoteMidiNumber for 'E', and -1 indicates a flat).
   */
  _convertReadableNoteToNote(readableNote: ReadableMusicNote): {
    baseNoteMidiNumber: number;
    offset: number;
  } {
    let readableNoteName = readableNote.readableNoteName;
    if (readableNoteName.length === 2) {
      // This is a natural note.
      return {
        baseNoteMidiNumber: this.NOTE_NAMES_TO_MIDI_VALUES[readableNoteName],
        offset: 0,
      };
    } else if (readableNoteName.length === 3) {
      // This is a note with an accidental.
      let offset =
        readableNoteName[1] === '#'
          ? 1
          : readableNoteName[1] === 'b'
            ? -1
            : null;
      if (offset === null) {
        console.error('Invalid readable note: ' + readableNoteName);
      }

      return {
        baseNoteMidiNumber:
          this.NOTE_NAMES_TO_MIDI_VALUES[
            readableNoteName[0] + readableNoteName[2]
          ],
        offset: offset,
      };
    } else {
      // This is not a valid readableNote.
      console.error('Invalid readable note: ' + readableNote);
    }
  }

  // For each note in a sequence, add a noteDuration property.
  // TODO(#15177): Add more features to Music-Notes-Input Interaction
  // Add more options for note durations.
  _makeAllNotesHaveDurationOne(
    noteArray: ReadableMusicNote[]
  ): ReadableMusicNote[] {
    for (let i = 0; i < noteArray.length; i++) {
      noteArray[i].noteDuration = {
        num: 1,
        den: 1,
      };
    }
    return noteArray;
  }

  submitAnswer(): void {
    let readableSequence: MusicNotesAnswer[] = [];
    for (let i = 0; i < this.noteSequence.length; i++) {
      readableSequence.push(
        this._convertNoteToReadableNote(this.noteSequence[i].note)
      );
    }
    readableSequence = this._makeAllNotesHaveDurationOne(readableSequence);
    if (readableSequence) {
      this.currentInteractionService.onSubmit(
        readableSequence as InteractionAnswer,
        this.musicNotesInputRulesService
      );
    }
  }

  /** *****************************************************************
   * Functions involving MIDI playback.
   ******************************************************************/

  playSequenceToGuess(): void {
    let noteSequenceToGuess = [];
    for (let i = 0; i < this.sequenceToGuess.value.length; i++) {
      noteSequenceToGuess.push(
        this._convertReadableNoteToNote(this.sequenceToGuess.value[i])
      );
    }
    this.playSequence(
      this.convertSequenceToGuessToMidiSequence(noteSequenceToGuess)
    );
  }

  playCurrentSequence(): void {
    this.playSequence(
      this.convertNoteSequenceToMidiSequence(this.noteSequence)
    );
  }

  // Takes an input > 0, converts to a noteStart object and returns a
  // float representation of the noteStart position.
  getNoteStart(noteIndex: number): number {
    return this.getNoteStartAsFloat({
      noteStart: {
        num: noteIndex,
        den: 1,
      },
    } as MusicNote);
  }

  // Input is a midiSequence, which is an array of arrays, in the form of
  // [[72], [62], [67, 71, 74]]. An inner array with more than one value
  // is treated like a chord and all its values are played back
  // simultaneously.
  playSequence(midiSequence: number[][]): void {
    // TODO(#7892): Move this check to music-phrase-player.service.ts
    // once AlertsService has been successfully migrated.
    if (window.AudioContext || window.Audio) {
      let notes = [];
      for (let i = 0; i < midiSequence.length; i++) {
        for (let j = 0; j < midiSequence[i].length; j++) {
          notes.push({
            midiValue: midiSequence[i][j],
            duration: 1.0,
            start: this.getNoteStart(i),
          });
        }
      }

      this.musicPhrasePlayerService.playMusicPhrase(notes);
    } else {
      this.alertsService.addWarning(
        'MIDI audio is not supported in your browser.'
      );
    }
  }

  // A MIDI pitch is the baseNoteMidiNumber of the note plus the offset.
  _convertNoteToMidiPitch(note: MusicNote): number {
    return note.baseNoteMidiNumber + note.offset;
  }

  // Return the MIDI value for each note in the sequence.
  // TODO(#15177): Add more features to Music-Notes-Input Interaction.
  // Add chord functionality.
  convertSequenceToGuessToMidiSequence(sequence: MusicNote[]): number[][] {
    let midiSequence = [];
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].hasOwnProperty('baseNoteMidiNumber')) {
        midiSequence.push([this._convertNoteToMidiPitch(sequence[i])]);
      } else {
        console.error('Invalid note: ' + sequence[i]);
      }
    }
    return midiSequence;
  }

  // Return the MIDI value for each note in the sequence.
  // TODO(#15177): Add more features to Music-Notes-Input Interaction.
  // Add chord functionality.
  convertNoteSequenceToMidiSequence(sequence: NoteSequence[]): number[][] {
    let midiSequence = [];
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].hasOwnProperty('note')) {
        // Single note.
        midiSequence.push([this._convertNoteToMidiPitch(sequence[i].note)]);
      } else {
        console.error('Invalid note: ' + sequence[i]);
      }
    }
    return midiSequence;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
