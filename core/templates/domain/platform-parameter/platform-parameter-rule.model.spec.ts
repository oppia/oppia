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
 * @fileoverview Unit tests for PlatformParameterRuleModel.
 */

import {PlatformParameterFilterType} from 'domain/platform-parameter/platform-parameter-filter.model';
import {
  PlatformParameterRule,
  PlatformParameterRuleBackendDict,
} from 'domain/platform-parameter/platform-parameter-rule.model';

describe('PlatformParameterRuleModel', () => {
  it('should create an instance from a backend dict.', () => {
    const rule = PlatformParameterRule.createFromBackendDict({
      filters: [
        {
          type: PlatformParameterFilterType.PlatformType,
          conditions: [['=', 'Web']],
        },
        {
          type: PlatformParameterFilterType.AppVersion,
          conditions: [['=', '1.0.0']],
        },
      ],
      value_when_matched: true,
    });

    expect(rule.valueWhenMatched).toBeTrue();
    expect(rule.filters.length).toEqual(2);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict: PlatformParameterRuleBackendDict = {
      filters: [
        {
          type: PlatformParameterFilterType.PlatformType,
          conditions: [['=', 'Web']],
        },
        {
          type: PlatformParameterFilterType.AppVersion,
          conditions: [['=', '1.0.0']],
        },
      ],
      value_when_matched: true,
    };

    const instance = PlatformParameterRule.createFromBackendDict(backendDict);

    expect(instance.toBackendDict()).toEqual(backendDict);
  });
});
