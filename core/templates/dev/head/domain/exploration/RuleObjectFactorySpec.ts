// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
import { RuleObjectFactory, Rule } from
  'domain/exploration/RuleObjectFactory';

fdescribe('RuleObjectFactory', () => {
  let ruleObjectFactory;
  let ruleBackendDict: any;
  let inputBackend
  beforeEach(() => {
    ruleObjectFactory = TestBed.get(RuleObjectFactory);
    inputBackend = {
      'x': [['<p>list_of_sets_of_html_strings</p>']]
    }
    ruleBackendDict = {
      rule_type: 'rule_type_1',
      inputs: inputBackend
    };
  });

  it('should creat new rule', () => {
    var rules =
      ruleObjectFactory.createFromBackendDict(ruleBackendDict);
    expect(rules.getInput()).toEqual(inputBackend);
    expect(rules.getType()).toEqual('rule_type_1');
  });

  it('should convert to a backend dictionary', () => {
    var rules =
      ruleObjectFactory.createFromBackendDict(ruleBackendDict);
    expect(rules.toBackendDict()).toEqual(ruleBackendDict);
  });

  it('should creat a new rule from creatNew()', () => {
    var rules =
      ruleObjectFactory.createNew('rule_type_1', inputBackend);
    expect(rules.getInput()).toEqual(inputBackend);
    expect(rules.getType()).toEqual('rule_type_1');
  });
});
