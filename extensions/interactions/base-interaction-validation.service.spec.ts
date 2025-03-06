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
 * @fileoverview Unit tests for all interaction validators.
 *
 * NOTE TO DEVELOPERS: Many of the exploration validators simply defer their
 * validation to the baseValidator. As a result, they require no additional
 * testing. You will see some test suites in this file which simply have a
 * single test for the validator along the lines of "it should be able to
 * perform basic validation." These simple tests are to ensure the policy of the
 * validator is to defer validation to the baseValidator, since it has its own
 * tests to ensure it is working properly.
 */

import { TestBed } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { BaseInteractionValidationService } from 'interactions/base-interaction-validation.service';

describe('Interaction Validator', () => {
  let bivs: BaseInteractionValidationService;
  let WARNING_TYPES;
  let agof: AnswerGroupObjectFactory;
  let oof: OutcomeObjectFactory;

  let currentState: string;
  let otherState: string;
  let goodOutcomeDest;
  let goodOutcomeFeedback;
  let badOutcome;
  let goodAnswerGroups;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BaseInteractionValidationService, AnswerGroupObjectFactory, OutcomeObjectFactory],
    });

    bivs = TestBed.inject(BaseInteractionValidationService);
    WARNING_TYPES = AppConstants.WARNING_TYPES;
    agof = TestBed.inject(AnswerGroupObjectFactory);
    oof = TestBed.inject(OutcomeObjectFactory);

    currentState = 'First State';
    otherState = 'Second State';
    goodOutcomeDest = oof.createFromBackendDict({
      dest: otherState,
      dest_if_really_stuck: null,
      feedback: { html: '', audio_translations: {} },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    goodOutcomeFeedback = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: { html: 'Feedback', audio_translations: {} },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });
    badOutcome = oof.createFromBackendDict({
      dest: currentState,
      dest_if_really_stuck: null,
      feedback: { html: '', audio_translations: {} },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null,
    });

    goodAnswerGroups = [
      agof.createNew([], goodOutcomeDest, false, null),
      agof.createNew([], goodOutcomeFeedback, false, null),
    ];
  });

  describe('baseValidator', () => {
    it('should have no warnings for good answer groups with no confusing outcomes', () => {
      const warnings = bivs.getAnswerGroupWarnings(goodAnswerGroups, currentState);
      expect(warnings).toEqual([]);
    });

    it('should have a warning for an answer group with a confusing outcome', () => {
      const answerGroups = [
        agof.createNew([], goodOutcomeDest, false, null),
        agof.createNew([], badOutcome, false, null),
        agof.createNew([], goodOutcomeFeedback, false, null),
      ];
      const warnings = bivs.getAnswerGroupWarnings(answerGroups, currentState);
      expect(warnings.length).toBe(1);
      expect(warnings[0].type).toBe(WARNING_TYPES.ERROR);
      expect(warnings[0].message).toContain('Oppia response 2');
    });

    it('should validate customization arguments properly', () => {
      const warnings = bivs.requireCustomizationArguments({}, ['levelone']);
      expect(warnings).toContain('Expected customization arguments to have property: levelone');
    });

    it('should validate multiple missing top-level fields in customization arguments', () => {
      const expectedArgs = ['first', 'second'];
      const warnings = bivs.requireCustomizationArguments({}, expectedArgs);
      expect(warnings).toContain('Expected customization arguments to have properties: first, second');
    });
  });
});
