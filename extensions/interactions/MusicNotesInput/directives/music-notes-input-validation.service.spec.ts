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

import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {MusicNotesInputValidationService} from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';

import {AppConstants} from 'app.constants';
import {Rule} from 'domain/exploration/rule.model';
import {MusicNotesInputCustomizationArgs} from 'extensions/interactions/customization-args-defs';
import cloneDeep from 'lodash/cloneDeep';

describe('MusicNotesInputValidationService', () => {
  let validatorService: MusicNotesInputValidationService;
  let customizationArgs: MusicNotesInputCustomizationArgs;

  let currentState: string;
  let answerGroups: AnswerGroup[],
    goodAnswerGroups: AnswerGroup[],
    goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MusicNotesInputValidationService],
    });

    validatorService = TestBed.get(MusicNotesInputValidationService);

    oof = TestBed.get(OutcomeObjectFactory);
    agof = TestBed.get(AnswerGroupObjectFactory);

    currentState = 'First State';
    goodDefaultOutcome = oof.createFromBackendDict({
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
    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, [], '')];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState,
      {
        sequenceToGuess: {
          value: [],
        },
        initialSequence: {
          value: [],
        },
      },
      goodAnswerGroups,
      goodDefaultOutcome
    );
    expect(warnings).toEqual([]);
  });

  it('should throw error when rule HasLengthInclusivelyBetween is invalid', () => {
    var answerGroup = agof.createNew(
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
        message: 'The rule in response group 1 is invalid. 5 is more than 0',
      },
      {
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'The rule in response group 2 is invalid. 5 is more than 0',
      },
    ]);
  });
});
