// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the PencilCodeEditorValidationService.
 */

import { TestBed } from '@angular/core/testing';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from
  'domain/exploration/RuleObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';

/* eslint-disable max-len */
import { PencilCodeEditorValidationService } from
  'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service.ts';
/* eslint-enable max-len */

describe('Pencil Code Editor Validation Service', () => {
  let pcevs: PencilCodeEditorValidationService = null;
  let outcomeObjectFactory : OutcomeObjectFactory = null;
  let ruleObjectFactory : RuleObjectFactory = null;
  let answerGroupObjectFactory : AnswerGroupObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PencilCodeEditorValidationService]
    });

    pcevs = TestBed.get(PencilCodeEditorValidationService);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
  });

  it('should validates customizationArgs', () => {
    let array = [];
    let customizationArgs = {
      initial_code: '# Add the initial code snippet here.↵',
    };

    expect(pcevs.getCustomizationArgsWarnings(customizationArgs))
      .toEqual(array);
  });

  it('should evaluate all the feedbacks warnings.', () => {
    let stateName = 'Introduction';
    let customizationArgs = {
      initial_code: '# Add the initial code snippet here.↵',
    };
    let id = 'feedback_1';
    let answer_html = '<p>Hello</p>';
    let content_html = '';
    let training_data = []
    let outcome_for_answer = outcomeObjectFactory.createNew(stateName, id, answer_html, training_data);
    let outcome = outcomeObjectFactory.createNew(stateName, id, content_html, training_data);
    let rule = ruleObjectFactory.createNew('CodeEquals', { x: 'hello'});
    let answer = answerGroupObjectFactory.createNew([rule], outcome_for_answer, [], null);
    let answer_groups = [answer];
    let output = pcevs.getAllWarnings(
      stateName, customizationArgs, answer_groups, outcome);
    let feedback_not_added = 'Please add feedback for the user ' +
    'in the [All other answers] rule.';
    expect(output[0].message).toBe(feedback_not_added);
    let feedback_html = '<p>wrong</p>';
    let feedback_utcome = outcomeObjectFactory.createNew(stateName, id, feedback_html, training_data);
    let feeback_rule = ruleObjectFactory.createNew('CodeEquals', { x: 'hello'});
    let feedback_answer = answerGroupObjectFactory.createNew([feeback_rule], feedback_utcome, [], null);
    let feedback_answer_groups = [feedback_answer];
    let feedback_output = pcevs.getAllWarnings(
      stateName, customizationArgs, feedback_answer_groups, feedback_utcome);
    let feedback_added = [];
    expect(feedback_output).toEqual(feedback_added);
  });
});
