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
 * @fileoverview Unit tests for PlatformParameterFilterModel.
 */

import {
  PlatformParameterFilter,
  PlatformParameterFilterBackendDict,
  PlatformParameterFilterType,
} from 'domain/platform-parameter/platform-parameter-filter.model';

describe('PlatformParameterFilterModel', () => {
  it('should create an instance from a backend dict.', () => {
    const filter = PlatformParameterFilter.createFromBackendDict({
      type: PlatformParameterFilterType.PlatformType,
      conditions: [['=', 'Web']],
    });

    expect(filter.type).toEqual(PlatformParameterFilterType.PlatformType);
    expect(filter.conditions).toEqual([['=', 'Web']]);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict: PlatformParameterFilterBackendDict = {
      type: PlatformParameterFilterType.PlatformType,
      conditions: [['=', 'Web']],
    };

    const instance = PlatformParameterFilter.createFromBackendDict(backendDict);

    expect(instance.toBackendDict()).toEqual(backendDict);
  });
});
