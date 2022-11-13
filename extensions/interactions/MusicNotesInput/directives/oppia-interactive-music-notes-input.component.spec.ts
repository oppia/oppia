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
 * @fileoverview Unit tests for the music notes input component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MusicNotesInputComponent } from './oppia-interactive-music-notes-input.component';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ReadableMusicNote } from 'extensions/interactions/customization-args-defs';
import { MockTranslatePipe } from 'tests/unit-test-utils';

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

describe('Response music notes input component ', () => {
  let component: MusicNotesInputComponent;
  let fixture: ComponentFixture<MusicNotesInputComponent>;
  // eslint-disable-next-line max-len
  let iaes: InteractionAttributesExtractorService;
  let cis: CurrentInteractionService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MusicNotesInputComponent,
        MockTranslatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(MusicNotesInputComponent);
      component = fixture.componentInstance;
      // eslint-disable-next-line max-len
      iaes = TestBed.inject(InteractionAttributesExtractorService);
      cis = TestBed.inject(CurrentInteractionService);
      component.lastAnswer = 'last-answer';
      component.sequenceToGuessWithValue = 'seq-guess';
      component.initialSequenceWithValue = 'init-seq';
    });

    it('should initialise the component', () => {
      const obj = {
        sequenceToGuess: 'guess',
        initialSequence: 'init'
      };
      spyOn(iaes, 'getValuesFromAttributes').and.returnValue(obj);
      spyOn(component, 'initializeNoteSequence');
      spyOn(component, 'init');
      spyOn(cis, 'registerCurrentInteraction');

      component.ngOnInit();

      expect(component.sequenceToGuess).toEqual('guess');
      expect(component.initialSequence).toEqual('last-answer');
      expect(component.init).toHaveBeenCalled();
      expect(component.initializeNoteSequence).toHaveBeenCalled();
      expect(cis.registerCurrentInteraction).toHaveBeenCalled();
    });

    it('should reinit staff after the view has loaded', () => {
      spyOn(component, 'reinitStaff');

      component.ngAfterViewInit();

      expect(component.reinitStaff).toHaveBeenCalled();
    });

    it('should add note to sequence', () => {
      expect(component.noteSequence.length).toEqual(0);

      const note: MusicNote = {
        baseNoteMidiNumber: 1,
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 0,
          den: 0,
        }
      };

      component._addNoteToNoteSequence(note);

      expect(component.noteSequence.length).toEqual(1);
      expect(component.noteSequence[0].note).toEqual(note);
    });

    it('should remove note id from note sequence', () => {
      const note1: MusicNote = {
        baseNoteMidiNumber: 1,
        offset: 1,
        noteId: '1',
        noteStart: {
          num: 0,
          den: 0,
        }
      };
      const note2: MusicNote = {
        baseNoteMidiNumber: 1,
        offset: 1,
        noteId: '2',
        noteStart: {
          num: 0,
          den: 0,
        }
      };

      const ns1: NoteSequence = {
        note: note1
      };
      const ns2: NoteSequence = {
        note: note2
      };

      component.noteSequence = [ns1, ns2];
      expect(component.noteSequence.length).toEqual(2);

      component._removeNotesFromNoteSequenceWithId('1');
      expect(component.noteSequence.length).toEqual(1);

      component._removeNotesFromNoteSequenceWithId('4');
      expect(component.noteSequence.length).toEqual(1);
    });

    it('should generate note ID', () => {
      component._currentNoteId = 0;

      const nodeId = component.generateNoteId();

      expect(nodeId).toEqual('note_id_0');
    });

    it('should init note sequence', () => {
      expect(component.noteSequence.length).toEqual(0);

      const d1 = {
        readableNoteName: 'A5',
        noteDuration: {
          num: 1,
          den: 1,
        },
      };

      const d2 = {
        readableNoteName: 'G5',
        noteDuration: {
          num: 2,
          den: 2,
        },
      };

      const initNodes = {
        value: [d1, d2]
      };

      component.initializeNoteSequence(initNodes);

      expect(component.noteSequence.length).toEqual(2);
    });

    it('should compare notes', () => {
      const note1: MusicNote = {
        baseNoteMidiNumber: 1,
        offset: 1,
        noteId: '1',
        noteStart: {
          num: 1,
          den: 1,
        }
      };

      const note2: MusicNote = {
        baseNoteMidiNumber: 1,
        offset: 1,
        noteId: '2',
        noteStart: {
          num: 4,
          den: 2,
        }
      };

      const out = component.compareNoteStarts({note: note1}, {note: note2});

      expect(out).toEqual(-1);
    });

    it('should get note start from left position', () => {
      spyOn(component, 'getHorizontalPosition').and.returnValue(1);

      const note = {
        noteStart: {
          num: 0,
          den: 1
        }
      };

      expect(component.getNoteStartFromLeftPos(100)).toEqual(undefined);
      expect(component.getNoteStartFromLeftPos(2)).toEqual({note: note});
    });

    it('should get note start as float', () => {
      const note1 = {
        noteStart: {
          num: 1,
          den: 1
        }
      } as MusicNote;

      const note2 = {
        noteStart: {
          num: 6,
          den: 2
        }
      } as MusicNote;

      expect(component.getNoteStartAsFloat(note1)).toEqual(1);
      expect(component.getNoteStartAsFloat(note2)).toEqual(3);
    });

    it('should get vertical position', () => {
      const obj = {
        1: 3
      };

      spyOn(component, 'getStaffLinePositions').and.returnValue(obj);

      expect(component.getVerticalPosition(1)).toEqual(3);
    });

    it('should check if line value is a ledger line', () => {
      expect(component.isLedgerLineNote('C4')).toBeTrue();
      expect(component.isLedgerLineNote('C3')).toBeFalse();
    });

    it('should repaint ledger lines', () => {
      const ns1 = {
        note: {
          baseNoteMidiNumber: 1,
          offset: 1,
          noteId: '1',
          noteStart: {
            num: 1,
            den: 1,
          }
        }
      };

      const ns2 = {
        note: {
          baseNoteMidiNumber: 1,
          offset: 1,
          noteId: '1',
          noteStart: {
            num: 3,
            den: 2,
          }
        }
      };

      component.noteSequence = [ns1, ns2];

      spyOn(component, 'getHorizontalPosition').and.returnValue(1);
      spyOn(component, '_getCorrespondingNoteName').and.returnValue('C4');
      spyOn(component, 'drawLedgerLine');

      component.repaintLedgerLines();

      expect(component.drawLedgerLine).toHaveBeenCalled();
    });

    it('should get corresponding note name', () => {
      spyOn(console, 'error');
      let noteName = component._getCorrespondingNoteName(81);

      expect(noteName).toEqual('A5');

      noteName = component._getCorrespondingNoteName(1000);

      expect(console.error).toHaveBeenCalled();
      expect(noteName).toEqual(null);
    });

    it('should convert note to readable note', () => {
      spyOn(console, 'error');

      const ns1 = {
        baseNoteMidiNumber: 81,
        offset: 1000,
        noteId: '1',
        noteStart: {
          num: 1,
          den: 1,
        }
      } as MusicNote;

      const ns2 = {
        baseNoteMidiNumber: 81,
        offset: 1,
        noteId: '1',
        noteStart: {
          num: 1,
          den: 1,
        }
      } as MusicNote;

      expect(component._convertNoteToReadableNote(ns1));
      expect(console.error).toHaveBeenCalled();

      expect(
        component._convertNoteToReadableNote(ns2).readableNoteName)
        .toEqual('A#5');
    });

    it('should convert readable note to note', () => {
      spyOn(console, 'error');

      const rn1 = {
        readableNoteName: 'A#5'
      } as ReadableMusicNote;
      const rn2 = {
        readableNoteName: 'A5'
      } as ReadableMusicNote;
      const rn3 = {
        readableNoteName: 'A12'
      } as ReadableMusicNote;
      const rn4 = {
        readableNoteName: 'Wrong'
      } as ReadableMusicNote;

      expect(component._convertReadableNoteToNote(rn2)).toEqual({
        baseNoteMidiNumber: 81,
        offset: 0
      });

      expect(component._convertReadableNoteToNote(rn1)).toEqual({
        baseNoteMidiNumber: 81,
        offset: 1
      });

      expect(component._convertReadableNoteToNote(rn3));
      expect(console.error).toHaveBeenCalled();

      expect(component._convertReadableNoteToNote(rn4));
      expect(console.error).toHaveBeenCalled();
    });

    it('should make all notes same duration', () => {
      const rn1 = {
        readableNoteName: 'A#5',
        noteDuration: {
          num: 3,
          den: 2
        }
      } as ReadableMusicNote;
      const rn2 = {
        readableNoteName: 'A#5',
        noteDuration: {
          num: 6,
          den: 2
        }
      } as ReadableMusicNote;
      const rn3 = {
        readableNoteName: 'A#5',
        noteDuration: {
          num: 1,
          den: 1,
        }
      } as ReadableMusicNote;
      const rn4 = {
        readableNoteName: 'A#5',
        noteDuration: {
          num: 1,
          den: 1
        }
      } as ReadableMusicNote;

      const array = [rn1, rn2];
      const array2 = [rn3, rn4];

      expect(component._makeAllNotesHaveDurationOne(array)).toEqual(array2);
    });

    it('should submit answer', () => {
      const note: MusicNote = {
        baseNoteMidiNumber: 81,
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 1,
          den: 1,
        }
      };

      component.noteSequence = [{note: note}];

      spyOn(cis, 'onSubmit');

      component.submitAnswer();

      expect(cis.onSubmit).toHaveBeenCalled();
    });

    it('should play sequence to guess', () => {
      spyOn(component, 'playSequence');

      const rn1 = {
        readableNoteName: 'A#5'
      } as ReadableMusicNote;
      const rn2 = {
        readableNoteName: 'A5'
      } as ReadableMusicNote;

      const array = [rn1, rn2];
      component.sequenceToGuess = {
        value: array
      };

      component.playSequenceToGuess();

      expect(component.playSequence).toHaveBeenCalled();
    });

    it('should play current sequence', () => {
      spyOn(component, 'playSequence');
      component.playCurrentSequence();
      expect(component.playSequence).toHaveBeenCalled();
    });

    it('should get note start', () => {
      expect(component.getNoteStart(5)).toEqual(5);
      expect(component.getNoteStart(3)).toEqual(3);
    });

    it('should convert note to MIDI pitch', () => {
      const note: MusicNote = {
        baseNoteMidiNumber: 81,
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 1,
          den: 1,
        }
      };

      expect(component._convertNoteToMidiPitch(note)).toEqual(82);
    });

    it('should convert sequence to guess to MIDI sequence', () => {
      spyOn(console, 'error');

      const note1: MusicNote = {
        baseNoteMidiNumber: 81,
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 1,
          den: 1,
        }
      };
      const note2 = {
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 1,
          den: 1,
        }
      } as MusicNote;

      const seq = [note1, note2];
      const arr = [[82]];

      let out = component.convertSequenceToGuessToMidiSequence(seq);
      expect(console.error).toHaveBeenCalled();
      expect(out).toEqual(arr);
    });

    it('should convert note sequence to MIDI sequence', () => {
      spyOn(console, 'error');

      const note1: MusicNote = {
        baseNoteMidiNumber: 81,
        offset: 1,
        noteId: 'ok',
        noteStart: {
          num: 1,
          den: 1,
        }
      };

      const arr = [{ note: note1 }, { test: note1 } as unknown as NoteSequence];
      const out = [[82]];

      expect(component.convertNoteSequenceToMidiSequence(arr)).toEqual(out);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
