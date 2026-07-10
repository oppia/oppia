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
 * @fileoverview Unit tests for music notes input validation service.
 */

import {TestBed} from '@angular/core/testing';

import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {MusicNotesInputValidationService} from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import {Outcome} from 'domain/exploration/outcome.model';

import {AppConstants} from 'app.constants';
import {Rule} from 'domain/exploration/rule.model';
import {
  MusicNotesInputCustomizationArgs,
  ReadableMusicNote,
} from 'extensions/interactions/customization-args-defs';
import cloneDeep from 'lodash/cloneDeep';

describe('MusicNotesInputValidationService', () => {
  let validatorService: MusicNotesInputValidationService;
  let customizationArgs: MusicNotesInputCustomizationArgs;

  let currentState: string;
  let answerGroups: AnswerGroup[],
    goodAnswerGroups: AnswerGroup[],
    goodDefaultOutcome: Outcome;

  const createNotes = function (
    numNotes: number,
    readableNoteName: string = 'C4'
  ): ReadableMusicNote[] {
    const notes: ReadableMusicNote[] = [];
    for (let i = 0; i < numNotes; i++) {
      notes.push({
        readableNoteName: readableNoteName,
        noteDuration: {num: 1, den: 1},
      });
    }
    return notes;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MusicNotesInputValidationService],
    });

    validatorService = TestBed.inject(MusicNotesInputValidationService);

    customizationArgs = {
      sequenceToGuess: {
        value: [],
      },
      initialSequence: {
        value: [],
      },
    };

    currentState = 'First State';
    goodDefaultOutcome = Outcome.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        html: '',
        content_id: '',
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    goodAnswerGroups = [AnswerGroup.createNew([], goodDefaultOutcome, [], '')];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([]);
  });

  it('should not raise warnings for valid customization arguments', () => {
    customizationArgs.sequenceToGuess.value = createNotes(8);
    customizationArgs.initialSequence.value = createNotes(8, 'A5');

    var warnings =
      validatorService.getCustomizationArgsWarnings(customizationArgs);
    expect(warnings).toEqual([]);
  });

  it('should raise a warning when the sequence to guess is too long', () => {
    customizationArgs.sequenceToGuess.value = createNotes(9);

    var warnings =
      validatorService.getCustomizationArgsWarnings(customizationArgs);
    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please make sure that the sequence of notes to guess has at ' +
          'most 8 notes.',
      },
    ]);
  });

  it('should raise a warning when the initial sequence is too long', () => {
    customizationArgs.initialSequence.value = createNotes(9);

    var warnings =
      validatorService.getCustomizationArgsWarnings(customizationArgs);
    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please make sure that the initial sequence of notes has at ' +
          'most 8 notes.',
      },
    ]);
  });

  it('should raise a warning when a sequence has an invalid note', () => {
    customizationArgs.sequenceToGuess.value = createNotes(1, 'B5');

    var warnings =
      validatorService.getCustomizationArgsWarnings(customizationArgs);
    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please make sure that all notes in the sequence of notes to ' +
          'guess are notes that can be placed on the staff (C4 through A5).',
      },
    ]);
  });

  it('should raise a warning when a note duration is not positive', () => {
    customizationArgs.initialSequence.value = createNotes(1);
    customizationArgs.initialSequence.value[0].noteDuration = {
      num: 0,
      den: 1,
    };

    var warnings =
      validatorService.getCustomizationArgsWarnings(customizationArgs);
    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message:
          'Please make sure that all note durations in the initial ' +
          'sequence of notes are positive.',
      },
    ]);
  });

  it('should throw error when rule HasLengthInclusivelyBetween is invalid', () => {
    var answerGroup = AnswerGroup.createNew(
      [
        Rule.createNew(
          'HasLengthInclusivelyBetween',
          {
            a: 5,
            b: 0,
          },
          {
            a: 'NonnegativeInt',
            b: 'NonnegativeInt',
          }
        ),
      ],
      goodDefaultOutcome,
      [],
      null
    );

    answerGroups = [answerGroup, cloneDeep(answerGroup)];

    var warnings = validatorService.getAllWarnings(
      currentState,
      customizationArgs,
      answerGroups,
      goodDefaultOutcome
    );

    expect(warnings).toEqual([
      {
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The rule in response group 1 is invalid -- 5 is more than 0',
      },
      {
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The rule in response group 2 is invalid -- 5 is more than 0',
      },
    ]);
  });
});
