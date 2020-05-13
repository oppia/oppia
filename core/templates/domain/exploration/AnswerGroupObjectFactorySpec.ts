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
 * @fileoverview Unit tests for AnswerGroupObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroupObjectFactory, AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory.ts';
import { RuleObjectFactory, IBackendRuleDict, IRuleInput, Rule } from
  'domain/exploration/RuleObjectFactory';
import { OutcomeObjectFactory, Outcome } from
  'domain/exploration/OutcomeObjectFactory';

describe('Answer Group Object Factory', () => {
  let answerGroupObjectFactory: AnswerGroupObjectFactory = null;
  let outcomeObjectFactory : OutcomeObjectFactory = null;
  let ruleObjectFactory : RuleObjectFactory = null;
  let ruleBackendDict: IBackendRuleDict = null;
  let inputBackend: IRuleInput = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnswerGroupObjectFactory]
    });

    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
  });

  it('should test the createFromBackendDict function', () => {
    inputBackend = {
      x: [['<p>list_of_sets_of_html_strings</p>']]
    };
    ruleBackendDict = {
      rule_type: 'rule_type_1',
      inputs: inputBackend
    };
    let rule1 = ruleObjectFactory.createFromBackendDict(ruleBackendDict);
    let rules1 = [rule1];
    let outcome1 = outcomeObjectFactory.createFromBackendDict({
        dest: 'A',
        feedback: 'feedback_1',
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: '1',
        missing_prerequisite_skill_id: '2'
      });
    let answerGroupBackendDict =   {
      outcome : outcome1,
      tagged_skill_misconception_id: null,
      rule_specs : rules1,
      training_data : []
    };
    let answer_backenddict = answerGroupObjectFactory.createFromBackendDict(answerGroupBackendDict);
    let check = {
      rule_specs: [{rule_type: undefined, inputs: {x: [ [ '<p>list_of_sets_of_html_strings</p>' ] ]}}], 
      outcome: {dest: 'A', feedback: {html: undefined, content_id: undefined}, 
      labelled_as_correct: undefined, 
      param_changes: undefined, 
      refresher_exploration_id: undefined, 
      missing_prerequisite_skill_id: undefined}, 
      training_data: [], 
      tagged_skill_misconception_id: null
    };
    expect(answer_backenddict.toBackendDict()).toEqual(check); 
  });

  it('should test the createNew function', () => {
    inputBackend = {
      x: [['<p>list_of_sets_of_html_strings</p>']]
    };
    let rule = new Rule('rule_type_1',inputBackend);
    let rules = [rule];
    let outcome = outcomeObjectFactory.createNew('B', 'feedback_1', 'feedback', []);
    let trainingData = [];
    let taggedSkillMisconceptionId = null;
    let answer_creatnew = answerGroupObjectFactory.createNew(rules,outcome,trainingData,taggedSkillMisconceptionId);
    let answer_constructor= new AnswerGroup(rules,outcome,trainingData,taggedSkillMisconceptionId);
    expect(answer_creatnew).toEqual(answer_constructor);
  });
});
