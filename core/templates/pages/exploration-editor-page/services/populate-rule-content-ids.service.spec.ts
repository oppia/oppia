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
 * @fileoverview Unit tests for PopulateRuleContentIdsService.
*/

import { TestBed } from '@angular/core/testing';

import { PopulateRuleContentIdsService } from
  'pages/exploration-editor-page/services/populate-rule-content-ids.service';

describe('Populate Rule Content Ids Service', () => {
  let populateRuleContentIdsService = null;

  beforeEach(() => {
    populateRuleContentIdsService = TestBed.get(PopulateRuleContentIdsService);
  });

  it('should populate null content ids on save', () => {
    let rule = {
      type: 'Equals',
      inputTypes: {x: 'TranslatableSetOfNormalizedString'},
      inputs: {x: {
        contentId: null,
        normalizedStrSet: []
      }}
    };
    expect(rule.inputs.x.contentId).toBeNull();
    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(rule.inputs.x.contentId).not.toBeNull();
  });

  it('should not populate non-null content ids on save', () => {
    const ruleInput = {
      contentId: 'rule_input',
      normalizedStrSet: []
    };

    let rule = {
      inputTypes: {x: 'TranslatableSetOfNormalizedString'},
      inputs: {x: ruleInput}
    };

    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(rule.inputs.x.contentId).toBe('rule_input');
  });

  it('should not populate content ids if input does not need one', () => {
    let rule = {
      type: 'HasNumberOfTermsEqualTo',
      inputTypes: {y: 'NonnegativeInt'},
      inputs: {y: 1}
    };
    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(rule.inputs).toEqual({y: 1});
  });
});
