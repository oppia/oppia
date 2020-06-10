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

import { RuleObjectFactory, IBackendRuleDict, IRuleInputs, Rule } from
  'domain/exploration/RuleObjectFactory';

describe('RuleObjectFactory', () => {
  let ruleObjectFactory: RuleObjectFactory = null;
  let ruleBackendDict: IBackendRuleDict = null;
  let inputBackend: IRuleInputs = null;

  beforeEach(() => {
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    inputBackend = {
      x: [['<p>list_of_sets_of_html_strings</p>']]
    };
    ruleBackendDict = {
      rule_type: 'rule_type_1',
      inputs: inputBackend
    };
  });

  it('should convert to a backend dictionary', () => {
    let rulesDict = ruleObjectFactory.createFromBackendDict(ruleBackendDict);
    expect(rulesDict.toBackendDict()).toEqual(ruleBackendDict);
  });

  it('should creat a new rule from creatNew()', () => {
    let rulesDict = ruleObjectFactory.createNew('rule_type_1', inputBackend);
    expect(rulesDict).toEqual(new Rule('rule_type_1', inputBackend));
  });
});
