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
 * @fileoverview unit test for RuleObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { RuleObjectFactory, RuleBackendDict, RuleInputs, Rule } from
  'domain/exploration/RuleObjectFactory';

describe('RuleObjectFactory', () => {
  let ruleObjectFactory: RuleObjectFactory;
  let ruleBackendDict: RuleBackendDict;
  let inputBackend: RuleInputs;

  beforeEach(() => {
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    inputBackend = {
      x: [['<p>list_of_sets_of_html_strings</p>']]
    };
    ruleBackendDict = {
      rule_type: 'Equals',
      inputs: inputBackend
    };
  });

  it('should convert to a backend dictionary', () => {
    const rule = ruleObjectFactory.createFromBackendDict(
      ruleBackendDict, 'ItemSelectionInput');
    expect(rule.toBackendDict()).toEqual(ruleBackendDict);
  });

  it('should create a new rule from createNew()', () => {
    let rulesDict = ruleObjectFactory.createNew(
      'rule_type_1', inputBackend, {
        x: ''
      });
    expect(rulesDict).toEqual(new Rule('rule_type_1', inputBackend, {
      x: ''
    }));
  });

  it('should throw an error on createNew() if the keys in inputs and ' +
    'inputTypes do not match', () => {
    expect(() => {
      ruleObjectFactory.createNew('rule_type_1', inputBackend, {});
    }).toThrowError('The keys of inputs and inputTypes do not match.');
  });
});
