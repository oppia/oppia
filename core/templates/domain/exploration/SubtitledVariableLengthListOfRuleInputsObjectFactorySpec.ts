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

import {
  SubtitledVariableLengthListOfRuleInputsObjectFactory,
  SubtitledVariableLengthListOfRuleInputs
} from
  'domain/exploration/SubtitledVariableLengthListOfRuleInputsObjectFactory';

/**
 * @fileoverview Unit tests for the SubtitledVariableLengthListOfRuleInputs
 * object factory.
 */

describe('SubtitledVariableLengthListOfRuleInputs object factory', () => {
  let svllori: SubtitledVariableLengthListOfRuleInputsObjectFactory;
  let subtitledRuleInputs: SubtitledVariableLengthListOfRuleInputs;

  beforeEach(() => {
    svllori = new SubtitledVariableLengthListOfRuleInputsObjectFactory();

    subtitledRuleInputs = svllori.createFromBackendDict({
      content_id: 'content_id',
      rule_inputs: []
    });
  });

  it('should convert to backend dict correctly', () => {
    expect(subtitledRuleInputs.toBackendDict()).toEqual({
      content_id: 'content_id',
      rule_inputs: []
    });
  });

  it('should create default object', () => {
    const defaultSubtitledRuleInputs = svllori
      .createDefault([], 'content_id');
    expect(defaultSubtitledRuleInputs.ruleInputs).toEqual([]);
    expect(defaultSubtitledRuleInputs.contentId).toEqual('content_id');
  });
});
