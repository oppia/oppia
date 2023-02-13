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
 * @fileoverview unit test for rule-object.model.
 */

import { RuleBackendDict, RuleInputs, Rule } from
  'domain/exploration/rule.model';

describe('Rule', () => {
  let ruleBackendDict: RuleBackendDict;
  let inputBackend: RuleInputs;

  beforeEach(() => {
    inputBackend = {
      x: [['<p>list_of_sets_of_html_strings</p>']]
    };
    ruleBackendDict = {
      rule_type: 'Equals',
      inputs: inputBackend
    };
  });

  it('should convert to a backend dictionary', () => {
    const rule = Rule.createFromBackendDict(
      ruleBackendDict, 'ItemSelectionInput');
    expect(rule.toBackendDict()).toEqual(ruleBackendDict);
  });

  it('should create a new rule from createNew()', () => {
    let rulesDict = Rule.createNew(
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
      Rule.createNew('rule_type_1', inputBackend, {});
    }).toThrowError('The keys of inputs and inputTypes do not match.');
  });
});
