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
 * @fileoverview Frontend Model for Platform Parameter Rule.
 */

import {
  PlatformParameterFilter,
  PlatformParameterFilterBackendDict,
} from 'domain/platform-parameter/platform-parameter-filter.model';

export type PlatformParameterValue = boolean | number | string;

export interface PlatformParameterRuleBackendDict {
  filters: PlatformParameterFilterBackendDict[];
  value_when_matched: PlatformParameterValue;
}

/**
 * Frontend domain object representation of platform parameter rules, which
 * are used to define scenarios in which a platform parameter should have
 * a specified value.
 *
 * On the frontend side, this class is used to reflect the edit made to
 * platform parameter rules in the admin page.
 */
export class PlatformParameterRule {
  filters: PlatformParameterFilter[];
  valueWhenMatched: PlatformParameterValue;

  constructor(
    filters: PlatformParameterFilter[],
    valueWhenMatched: PlatformParameterValue
  ) {
    this.filters = filters;
    this.valueWhenMatched = valueWhenMatched;
  }

  static createFromBackendDict(
    backendDict: PlatformParameterRuleBackendDict
  ): PlatformParameterRule {
    return new PlatformParameterRule(
      backendDict.filters.map(filterDict =>
        PlatformParameterFilter.createFromBackendDict(filterDict)
      ),
      backendDict.value_when_matched
    );
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {PlatformParameterRuleBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): PlatformParameterRuleBackendDict {
    return {
      filters: this.filters.map(filter => filter.toBackendDict()),
      value_when_matched: this.valueWhenMatched,
    };
  }
}
