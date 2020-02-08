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
 * @fileoverview unit tests for answer group object factory.
 */

import { TestBed } from '@angular/core/testing';

import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';

describe('Answer Group Object Factory', () => {
  let agof = null;
  let oof = null;
  let rof = null;
  let testAnswerGroup = null;
  let ruleList = null;
  let backendDict = null;
  let backendList = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnswerGroupObjectFactory]
    });
    agof = TestBed.get(AnswerGroupObjectFactory);
    oof = TestBed.get(OutcomeObjectFactory);
    rof = TestBed.get(RuleObjectFactory);
    testAnswerGroup = agof.createNew([], oof.createNew('dest_1',
      'outcome_1', '', []), ['training_data'], 'skill_id-1');
    ruleList = [
      rof.createNew('ruleType1', 'input1'),
      rof.createNew('ruleType2', 'input2')
    ];
    backendDict = {
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1'
    };
    backendList = [{
      rule_type: 'ruleType1',
      inputs: 'input1'
    },
    {
      rule_type: 'ruleType2',
      inputs: 'input2'
    }];
  });

  it('should create an answer group from dict and convert an answer ' +
  'group object to backend dict correctly', () => {
    expect(testAnswerGroup.toBackendDict()).toEqual(backendDict);
    expect(agof.createFromBackendDict(backendDict)).toEqual(testAnswerGroup);
  });

  it('should create rules from an array of dictionaries ', () => {
    expect(agof.generateRulesFromBackend(backendList)).toEqual(ruleList);
  });
});
