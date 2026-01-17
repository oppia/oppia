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
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {InteractionAnswer} from 'interactions/answer-defs';
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
import {CdkDragDrop, CdkDragEnd} from '@angular/cdk/drag-drop';

interface MusicNote {
  baseNoteMidiNumber: number;
  offset: number;
  noteId: string;
  noteStart: {
    num: number;
    den: number;
  } | null;
}

interface NoteSequence {
  note: MusicNote;
}

interface Sequence {
  value: ReadableMusicNote[];
}

interface Note {
  id: string;
  type: number;
  position?: {x: number; y: number};
}

interface DraggedNoteData {
  id?: string;
  type?: string;
  noteType: number;
  isPalette: boolean;
}

@Component({
  selector: 'oppia-interactive-music-notes-input',
  templateUrl: './music-notes-input-interaction.component.html',
})
export class MusicNotesInputComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() lastAnswer!: string | null;
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
  NOTE_TYPES = [this.NOTE_TYPE_NATURAL];
  NOTES_ON_LINES = ['E4', 'G4', 'B4', 'D5', 'F5'];
  LEDGER_LINE_NOTES = ['C4', 'A5'];
  verticalGridKeys = [81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60];
  SOUNDFONT_URL = '/third_party/static/midi-js-c26ebb/examples/soundfont/';
  MAXIMUM_NOTES_POSSIBLE = 8;
  NOTE_NAMES_TO_MIDI_VALUES =
    InteractionsExtensionsConstants.NOTE_NAMES_TO_MIDI_VALUES as Record<
      string,
      number
    >;

  staffContainerElt: HTMLElement | null = null;
  placedNotes: Note[] = [];

  @ViewChild('staffArea') staffAreaRef!: ElementRef;
  @ViewChild('validNoteArea') validNoteAreaRef!: ElementRef;

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

  private _getAttributes(): Record<string, string> {
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
      : (this.lastAnswer as string);

    this.staffContainerElt = this.elementRef.nativeElement.querySelector(
      '.oppia-music-input-staff'
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(() => {
        this.interactionIsActive = false;
        this.initialSequence = this.lastAnswer as string;
        this.reinitStaff();
      })
    );

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(),
      null
    );
    this.initializeNoteSequence(this.initialSequence as Sequence);
    this.init();
  }

  ngAfterViewInit(): void {
    this.reinitStaff();
  }

  _addNoteToNoteSequence(note: MusicNote): void {
    this.noteSequence.push({
      note: note,
    });
  }

  _sortNoteSequence(): void {
    this.noteSequence.sort(this.compareNoteStarts);
  }

  updateNoteSequenceFromPlacedNotes(): void {
    this.noteSequence = this.placedNotes.map(note => ({
      note: {
        baseNoteMidiNumber: this.NOTE_NAMES_TO_MIDI_VALUES.C4,
        offset: 0,
        noteId: note.id,
        noteStart: {
          num: 1,
          den: 1,
        },
      },
    }));
  }

  generateNoteId(): string {
    this._currentNoteId += 1;
    return 'note_id_' + (this._currentNoteId - 1);
  }

  reinitStaff(): void {
    const elem = document.querySelector(
      '.oppia-music-input-valid-note-area'
    ) as HTMLElement;

    if (elem) {
      this.renderer.setStyle(elem, 'visibility', 'hidden');

      setTimeout(() => {
        this.renderer.setStyle(elem, 'visibility', 'visible');
        this.init();
      }, 20);
    }
  }

  init(): void {
    if (this.staffContainerElt) {
      this.CONTAINER_WIDTH =
        this.staffContainerElt.getBoundingClientRect().width;
    }
    this.CONTAINER_HEIGHT = 0.2 * this.CONTAINER_WIDTH;

    this.HORIZONTAL_GRID_SPACING =
      this.CONTAINER_WIDTH / (this.MAXIMUM_NOTES_POSSIBLE + 1);

    this.VERTICAL_GRID_SPACING =
      this.CONTAINER_HEIGHT / this.verticalGridKeys.length;

    this.clearNotesFromStaff();
    this.clearDroppableStaff();
    this.buildDroppableStaff();
  }

  initializeNoteSequence(initialNotesToAdd: Sequence): void {
    if (!initialNotesToAdd || !initialNotesToAdd.value) {
      return;
    }
    for (let i = 0; i < initialNotesToAdd.value.length; i++) {
      const {baseNoteMidiNumber, offset} = this._convertReadableNoteToNote(
        initialNotesToAdd.value[i]
      );
      const initialNote: MusicNote = {
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

  clearNotesFromStaff(): void {
    const noteChoiceDivs = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-note-choices > div'
    );
    noteChoiceDivs.forEach((div: HTMLElement) => {
      if (div.parentNode) {
        this.renderer.removeChild(div.parentNode, div);
      }
    });
  }

  clearDroppableStaff(): void {
    const staffDivs = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-staff div'
    );
    staffDivs.forEach((div: HTMLElement) => {
      if (div.parentNode) {
        this.renderer.removeChild(div.parentNode, div);
      }
    });
  }

  getStaffLinePositions(): Record<string, number> {
    const staffLinePositions: Record<string, number> = {};
    const elements: NodeListOf<HTMLElement> =
      this.elementRef.nativeElement.querySelectorAll(
        '.oppia-music-input-staff div.oppia-music-staff-position'
      );

    elements.forEach((el: HTMLElement, index: number) => {
      staffLinePositions[this.verticalGridKeys[index]] = el.offsetTop;
    });
    return staffLinePositions;
  }

  onNoteDropped(event: CdkDragDrop<DraggedNoteData>): void {
    if (!this.interactionIsActive) {
      return;
    }

    const data = event.item.data;
    const draggedElement = event.item.element.nativeElement;
    const draggedRect = draggedElement.getBoundingClientRect();
    const staffRect = this.staffAreaRef.nativeElement.getBoundingClientRect();

    const relativeX = draggedRect.left - staffRect.left;
    if (data.isPalette) {
      const newNote: Note = {
        id: this.generateUniqueNoteId(),
        type: data.noteType,
        position: {
          x: this.snapToGrid(relativeX),
          y: 0,
        },
      };
      this.placedNotes.push(newNote);
    } else {
      const note = this.placedNotes.find(n => n.id === data.id);
      if (note) {
        note.position = {
          x: this.snapToGrid(relativeX),
          y: 0,
        };
      }
    }

    this._sortNoteSequence();
    this.updateNoteSequenceFromPlacedNotes();
  }

  onPlacedNoteDragEnd(event: CdkDragEnd, note: Note): void {
    const staffRect = this.staffAreaRef.nativeElement.getBoundingClientRect();
    const draggedRect =
      event.source.element.nativeElement.getBoundingClientRect();

    const isOutside =
      draggedRect.left < staffRect.left ||
      draggedRect.right > staffRect.right ||
      draggedRect.top < staffRect.top ||
      draggedRect.bottom > staffRect.bottom;

    if (isOutside) {
      this._removeNotesFromNoteSequenceWithId(note.id);
      this._sortNoteSequence();
      this.updateNoteSequenceFromPlacedNotes();
    }
  }

  _removeNotesFromNoteSequenceWithId(noteId: string): void {
    this.placedNotes = this.placedNotes.filter(note => note.id !== noteId);
  }

  snapToGrid(x: number): number {
    return (
      Math.round(x / this.HORIZONTAL_GRID_SPACING) *
      this.HORIZONTAL_GRID_SPACING
    );
  }

  getNoteClass(type: number): string {
    return type === this.NOTE_TYPE_NATURAL
      ? 'oppia-music-input-natural-note'
      : '';
  }

  generateUniqueNoteId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  buildDroppableStaff(): void {
    const lineValues = Object.keys(this.NOTE_NAMES_TO_MIDI_VALUES);
    const staffContainer = this.elementRef.nativeElement.querySelector(
      '.oppia-music-input-staff'
    ) as HTMLElement;
    if (!staffContainer) {
      return;
    }

    for (let i = 0; i < lineValues.length; i++) {
      const noteName = lineValues[i];
      const staffLineDiv = this.renderer.createElement('div');
      this.renderer.addClass(staffLineDiv, 'oppia-music-staff-position');
      this.renderer.setStyle(
        staffLineDiv,
        'height',
        `${this.VERTICAL_GRID_SPACING}px`
      );
      this.renderer.setAttribute(staffLineDiv, 'data-line-value', noteName);

      this.renderer.listen(staffLineDiv, 'dragover', (evt: DragEvent) => {
        evt.preventDefault();
        this.renderer.addClass(staffLineDiv, 'oppia-music-input-hovered');

        const lineValue = staffLineDiv.getAttribute('data-line-value');
        if (lineValue && this.isLedgerLineNote(lineValue)) {
          const relativeCursorX =
            evt.clientX - staffContainer.getBoundingClientRect().left;
          const topPos = staffLineDiv.getBoundingClientRect().top;
          this.drawLedgerLine(topPos, relativeCursorX);
        }
      });

      this.renderer.listen(staffLineDiv, 'dragleave', () => {
        this.renderer.removeClass(staffLineDiv, 'oppia-music-input-hovered');
        const ledgerLines = document.querySelectorAll(
          '.oppia-music-input-ledger-line'
        );
        if (ledgerLines.length > 0) {
          const last = ledgerLines[ledgerLines.length - 1] as HTMLElement;
          this.renderer.setStyle(last, 'display', 'none');
        }
      });

      this.renderer.listen(staffLineDiv, 'drop', (evt: DragEvent) => {
        evt.preventDefault();
        this.renderer.removeClass(staffLineDiv, 'oppia-music-input-hovered');

        const ledgerLines = document.querySelectorAll(
          '.oppia-music-input-ledger-line'
        );
        if (ledgerLines.length > 0) {
          this.renderer.setStyle(
            ledgerLines[ledgerLines.length - 1] as HTMLElement,
            'display',
            'none'
          );
        }

        const noteId =
          evt.dataTransfer?.getData('note/id') || this.generateNoteId();
        const noteType = evt.dataTransfer?.getData('note/type') || '0';
        const oldLeftPos = evt.dataTransfer?.getData('note/oldLeftPos');
        const startPos = oldLeftPos ? parseFloat(oldLeftPos) : undefined;

        let noteEl = document.getElementById(`note-${noteId}`);
        if (!noteEl) {
          noteEl = this.renderer.createElement('div');
          if (noteEl) {
            this.renderer.addClass(noteEl, 'oppia-music-input-note');
            this.renderer.setAttribute(noteEl, 'draggable', 'true');
            this.renderer.setAttribute(noteEl, 'id', `note-${noteId}`);
            this.renderer.setAttribute(noteEl, 'data-note-id', noteId);
            this.renderer.setAttribute(noteEl, 'data-note-type', noteType);
            this.renderer.appendChild(staffContainer, noteEl);
          }
        }

        if (!noteEl) {
          return;
        }

        const leftPos =
          evt.clientX - staffContainer.getBoundingClientRect().left;
        const topPos = staffLineDiv.offsetTop;
        const lineValue = staffLineDiv.getAttribute('data-line-value');
        if (!lineValue) {
          return;
        }

        const note: MusicNote = {
          baseNoteMidiNumber: this.NOTE_NAMES_TO_MIDI_VALUES[lineValue],
          offset: parseInt(noteType, 10),
          noteId,
          noteStart: null,
        };

        this._removeNotesFromNoteSequenceWithId(note.noteId);

        let finalLeft = leftPos;
        if (startPos !== finalLeft) {
          while (this.checkIfNotePositionTaken(finalLeft)) {
            finalLeft += this.HORIZONTAL_GRID_SPACING;
          }

          if (
            Math.floor(finalLeft) >
            Math.floor(
              this.getHorizontalPosition(this.MAXIMUM_NOTES_POSSIBLE - 1)
            )
          ) {
            const parent = noteEl.parentNode;
            if (parent) {
              this.renderer.removeChild(parent, noteEl);
            }
            this.repaintLedgerLines();
            return;
          }
        }

        this.renderer.setStyle(noteEl, 'position', 'absolute');
        this.renderer.setStyle(noteEl, 'left', `${finalLeft}px`);
        this.renderer.setStyle(
          noteEl,
          'top',
          `${topPos - this.VERTICAL_GRID_SPACING / 2.0}px`
        );
        this.renderer.addClass(noteEl, 'oppia-music-input-on-staff');

        const noteStartInfo = this.getNoteStartFromLeftPos(finalLeft);
        if (!noteStartInfo) {
          const parent = noteEl.parentNode;
          if (parent) {
            this.renderer.removeChild(parent, noteEl);
          }
          this.repaintLedgerLines();
          return;
        }

        note.noteStart = noteStartInfo.note.noteStart;

        this._addNoteToNoteSequence(note);
        this._sortNoteSequence();
        this.playSequence([[this._convertNoteToMidiPitch(note)]]);
        this.repaintLedgerLines();
      });

      this.renderer.appendChild(staffContainer, staffLineDiv);

      if (i === 0) {
        this.topPositionForCenterOfTopStaffLine =
          staffLineDiv.offsetTop + this.VERTICAL_GRID_SPACING;
      }

      if (this.NOTES_ON_LINES.includes(noteName)) {
        const staffLine = this.renderer.createElement('div');
        this.renderer.addClass(staffLine, 'oppia-music-staff-line');
        this.renderer.setStyle(
          staffLine,
          'margin-top',
          `${this.VERTICAL_GRID_SPACING / 2.5}px`
        );
        this.renderer.appendChild(staffLineDiv, staffLine);
      }
    }
  }

  compareNoteStarts(a: {note: MusicNote}, b: {note: MusicNote}): number {
    if (a.note.noteStart && b.note.noteStart) {
      return (
        (a.note.noteStart.num * b.note.noteStart.den -
          a.note.noteStart.den * b.note.noteStart.num) /
        (a.note.noteStart.den * b.note.noteStart.den)
      );
    }
    return 0;
  }

  checkIfNotePositionTaken(leftPos: number): boolean {
    const newNoteToCheck = this.getNoteStartFromLeftPos(leftPos);
    if (newNoteToCheck && newNoteToCheck.note.noteStart !== null) {
      for (let i = 0; i < this.noteSequence.length; i++) {
        const noteComparison = this.compareNoteStarts(
          this.noteSequence[i],
          newNoteToCheck
        );
        if (noteComparison === 0) {
          return true;
        }
      }
    }
    return false;
  }

  getNoteStartFromLeftPos(leftPos: number): NoteSequence | undefined {
    for (let i = 0; i < this.MAXIMUM_NOTES_POSSIBLE; i++) {
      if (Math.abs(leftPos - this.getHorizontalPosition(i)) < 2) {
        const note: MusicNote = {
          noteStart: {
            num: i,
            den: 1,
          },
          baseNoteMidiNumber: 0,
          offset: 0,
          noteId: '',
        };
        return {
          note: note,
        };
      }
    }
    return undefined;
  }

  getNoteStartAsFloat(note: MusicNote): number {
    return note.noteStart ? note.noteStart.num / note.noteStart.den : 0;
  }

  clearSequence(): void {
    this.placedNotes = [];
    this.noteSequence = [];
    const notesOnStaff = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-on-staff'
    );
    notesOnStaff.forEach((note: HTMLElement) => note.remove());
    const ledgerLines = this.elementRef.nativeElement.querySelectorAll(
      '.oppia-music-input-ledger-line'
    );
    ledgerLines.forEach((line: HTMLElement) => line.remove());
  }

  getVerticalPosition(baseNoteMidiNumber: number): number {
    return this.getStaffLinePositions()[baseNoteMidiNumber];
  }

  getHorizontalPosition(noteStartAsFloat: number): number {
    const firstNoteDiv = this.elementRef.nativeElement.querySelector(
      '.oppia-music-input-note-choices div:first-child'
    ) as HTMLElement;

    if (!firstNoteDiv) {
      return 0;
    }

    const lastHorizontalPositionOffset =
      firstNoteDiv.getBoundingClientRect().left;
    const leftOffset =
      lastHorizontalPositionOffset -
      (this.MAXIMUM_NOTES_POSSIBLE - 1) * this.HORIZONTAL_GRID_SPACING;
    return leftOffset + noteStartAsFloat * this.HORIZONTAL_GRID_SPACING;
  }

  isCloneOffStaff(helperClone: HTMLElement): boolean {
    const rect = helperClone.getBoundingClientRect();
    const top = rect.top;

    return !(top > this.staffTop && top < this.staffBottom);
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
      const note = this.noteSequence[i].note;
      const lineValue = this._getCorrespondingNoteName(note.baseNoteMidiNumber);
      if (lineValue && this.isLedgerLineNote(lineValue)) {
        this.drawLedgerLine(
          this.getVerticalPosition(note.baseNoteMidiNumber),
          this.getHorizontalPosition(this.getNoteStartAsFloat(note))
        );
      }
    }
  }

  _getCorrespondingNoteName(midiNumber: number): string | null {
    for (const noteName in this.NOTE_NAMES_TO_MIDI_VALUES) {
      if (this.NOTE_NAMES_TO_MIDI_VALUES[noteName] === midiNumber) {
        return noteName;
      }
    }
    return null;
  }

  _convertNoteToReadableNote(note: MusicNote): ReadableMusicNote {
    const correspondingNoteName = this._getCorrespondingNoteName(
      note.baseNoteMidiNumber
    );

    if (!correspondingNoteName) {
      throw new Error('Invalid MIDI pitch: ' + note.baseNoteMidiNumber);
    }

    const accidental = note.offset === 1 ? '#' : note.offset === 0 ? '' : 'b';

    return {
      readableNoteName:
        correspondingNoteName[0] + accidental + correspondingNoteName[1],
    } as ReadableMusicNote;
  }

  _convertReadableNoteToNote(readableNote: ReadableMusicNote): {
    baseNoteMidiNumber: number;
    offset: number;
  } {
    const readableNoteName = readableNote.readableNoteName;
    if (readableNoteName.length === 2) {
      return {
        baseNoteMidiNumber: this.NOTE_NAMES_TO_MIDI_VALUES[readableNoteName],
        offset: 0,
      };
    } else if (readableNoteName.length === 3) {
      const offset =
        readableNoteName[1] === '#' ? 1 : readableNoteName[1] === 'b' ? -1 : 0;

      return {
        baseNoteMidiNumber:
          this.NOTE_NAMES_TO_MIDI_VALUES[
            readableNoteName[0] + readableNoteName[2]
          ],
        offset: offset,
      };
    } else {
      throw new Error('Invalid readable note: ' + readableNoteName);
    }
  }

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
    let readableSequence: ReadableMusicNote[] = [];
    for (let i = 0; i < this.noteSequence.length; i++) {
      readableSequence.push(
        this._convertNoteToReadableNote(this.noteSequence[i].note)
      );
    }
    readableSequence = this._makeAllNotesHaveDurationOne(readableSequence);
    this.currentInteractionService.onSubmit(
      readableSequence as unknown as InteractionAnswer,
      this.musicNotesInputRulesService
    );
  }

  playSequenceToGuess(): void {
    const noteSequenceToGuess = [];
    for (let i = 0; i < this.sequenceToGuess.value.length; i++) {
      noteSequenceToGuess.push(
        this._convertReadableNoteToNote(this.sequenceToGuess.value[i])
      );
    }
    this.playSequence(
      this.convertSequenceToGuessToMidiSequence(
        noteSequenceToGuess as MusicNote[]
      )
    );
  }

  playCurrentSequence(): void {
    this.playSequence(
      this.convertNoteSequenceToMidiSequence(this.noteSequence)
    );
  }

  getNoteStart(noteIndex: number): number {
    return this.getNoteStartAsFloat({
      noteStart: {
        num: noteIndex,
        den: 1,
      },
      baseNoteMidiNumber: 0,
      offset: 0,
      noteId: '',
    });
  }

  playSequence(midiSequence: number[][]): void {
    const audioAvailable =
      (window as unknown as Record<string, unknown>).AudioContext ||
      (window as unknown as Record<string, unknown>).Audio;
    if (audioAvailable) {
      const notes = [];
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

  _convertNoteToMidiPitch(note: MusicNote): number {
    return note.baseNoteMidiNumber + note.offset;
  }

  convertSequenceToGuessToMidiSequence(sequence: MusicNote[]): number[][] {
    const midiSequence = [];
    for (let i = 0; i < sequence.length; i++) {
      midiSequence.push([this._convertNoteToMidiPitch(sequence[i])]);
    }
    return midiSequence;
  }

  convertNoteSequenceToMidiSequence(sequence: NoteSequence[]): number[][] {
    const midiSequence = [];
    for (let i = 0; i < sequence.length; i++) {
      midiSequence.push([this._convertNoteToMidiPitch(sequence[i].note)]);
    }
    return midiSequence;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  getDragData(note: Note): DraggedNoteData {
    return {
      id: note.id,
      type: note.type.toString(),
      noteType: note.type,
      isPalette: false,
    };
  }
}
