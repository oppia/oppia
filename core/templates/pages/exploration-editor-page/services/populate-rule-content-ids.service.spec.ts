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
import { Rule } from 'domain/exploration/rule.model';
import { TranslatableSetOfNormalizedString } from 'interactions/rule-input-defs';

import { PopulateRuleContentIdsService } from
  'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';

describe('Populate Rule Content Ids Service', () => {
  let populateRuleContentIdsService: PopulateRuleContentIdsService;
  let generateContentIdService: GenerateContentIdService;

  beforeEach(() => {
    populateRuleContentIdsService = TestBed.get(PopulateRuleContentIdsService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    generateContentIdService.init(() => 0, () => {});
  });

  it('should populate null content ids on save', () => {
    let rule = new Rule(
      'Equals', {
        x: {
          contentId: null,
          normalizedStrSet: []
        }
      }, { x: 'TranslatableSetOfNormalizedString' },
    );
    let content = rule.inputs.x as TranslatableSetOfNormalizedString;
    expect(content.contentId).toBeNull();
    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(content.contentId).not.toBeNull();
  });

  it('should not populate non-null content ids on save', () => {
    const ruleInput = {
      contentId: 'rule_input',
      normalizedStrSet: []
    };
    let rule = new Rule(
      'Equals', { x: ruleInput }, { x: 'TranslatableSetOfNormalizedString' });

    let content = rule.inputs.x as TranslatableSetOfNormalizedString;
    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(content.contentId).toBe('rule_input');
  });

  it('should not populate content ids if input does not need one', () => {
    let rule = new Rule(
      'HasNumberOfTermsEqualTo', { y: 1 }, { y: 'NonnegativeInt' });

    populateRuleContentIdsService.populateNullRuleContentIds(rule);
    expect(rule.inputs).toEqual({y: 1});
  });
});
