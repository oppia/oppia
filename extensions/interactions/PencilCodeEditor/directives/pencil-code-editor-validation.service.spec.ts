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
    let answerHtml = '<p>Hello</p>';
    let contentHtml = '';
    let trainingData = [];
    let outcomeForAnswer = outcomeObjectFactory.createNew(
      stateName, id, answerHtml, trainingData);
    let outcome = outcomeObjectFactory.createNew(
      stateName, id, contentHtml, trainingData);
    let rule = ruleObjectFactory.createNew('CodeEquals', { x: 'hello'});
    let answer = answerGroupObjectFactory.createNew(
      [rule], outcomeForAnswer, [], null);
    let answerGroups = [answer];
    let output = pcevs.getAllWarnings(
      stateName, customizationArgs, answerGroups, outcome);
    let feedback_not_added = 'Please add feedback for the user ' +
    'in the [All other answers] rule.';
    expect(output[0].message).toBe(feedback_not_added);
   
    let feedbackHtml = '<p>wrong</p>';
    let feedbackOutcome = outcomeObjectFactory.createNew(
      stateName, id, feedbackHtml, trainingData);
    let feedbackRule = ruleObjectFactory.createNew('CodeEquals', { x: 'hello'});
    let feedbackAnswer = answerGroupObjectFactory.createNew(
      [feedbackRule], feedbackOutcome, [], null);
    let feedbackAnswerGroups = [feedbackAnswer];
    let feedbackOutput = pcevs.getAllWarnings(
      stateName, customizationArgs, feedbackAnswerGroups, feedbackOutcome);
    let feedbackAdded = [];
    expect(feedbackOutput).toEqual(feedbackAdded);
  });
});
