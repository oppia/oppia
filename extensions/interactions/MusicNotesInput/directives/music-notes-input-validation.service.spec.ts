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

import { TestBed } from '@angular/core/testing';

import { AnswerGroup, AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { MusicNotesInputValidationService } from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import { Outcome, OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';

describe('MusicNotesInputValidationService', () => {
  let validatorService: MusicNotesInputValidationService;

  let currentState: string;
  let goodAnswerGroups: AnswerGroup[], goodDefaultOutcome: Outcome;
  let oof: OutcomeObjectFactory, agof: AnswerGroupObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MusicNotesInputValidationService]
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
        content_id: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    });
    goodAnswerGroups = [agof.createNew([], goodDefaultOutcome, [], '')];
  });

  it('should be able to perform basic validation', () => {
    var warnings = validatorService.getAllWarnings(
      currentState, {
        sequenceToGuess: {
          value: []
        },
        initialSequence: {
          value: []
        }
      }, goodAnswerGroups, goodDefaultOutcome);
    expect(warnings).toEqual([]);
  });
});
