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

  it('should evaluate all the warnings.', () => {
    let array = [];
    let stateName = 'Introduction';
    let customizationArgs = {
      initial_code: '# Add the initial code snippet here.↵',
    };
    let id = 'default_outcome';
    let html = '';
    let Outcome = outcomeObjectFactory.createNew(stateName, id, html, array);
    let Rule = ruleObjectFactory.createNew('CodeEquals',{x:'hello'});
    let answer = answerGroupObjectFactory.createNew([Rule], Outcome, [], null);
    let answerGroups = [answer];
    let output = pcevs.getAllWarnings(
      stateName, customizationArgs, answerGroups, Outcome);
    let MessageOne = 'Please specify what ' +  
    'Oppia should do in answer group 1.';
    let MessageTwo = 'Please add feedback for the user' + 
    'in the [All other answers] rule.';
    expect(output[0].message).toBe(MessageOne);
    expect(output[1].message).toBe(MessageTwo);
    html = '<p>wrongs</p>'
    Outcome = outcomeObjectFactory.createNew(stateName,id,html,array);
    Rule = ruleObjectFactory.createNew('CodeEquals',{ x:'hello'});
    answer = answerGroupObjectFactory.createNew([Rule], Outcome, [], null);
    answerGroups = [answer];
    output = pcevs.getAllWarnings(
      stateName, customizationArgs, answerGroups, Outcome);
    expect(pcevs.getAllWarnings(
      stateName, customizationArgs, answerGroups,
      Outcome)).toEqual(array);
  });
});
