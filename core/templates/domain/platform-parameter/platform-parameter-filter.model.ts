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
 * @fileoverview Frontend Model for Platform Parameter Filter.
 */

import cloneDeep from 'lodash/cloneDeep';

export enum PlatformParameterFilterType {
  PlatformType = 'platform_type',
  AppVersion = 'app_version',
  AppVersionFlavor = 'app_version_flavor',
}

/**
 * Frontend domain object representation of platform parameter filters, which
 * are used to define conditions in which a rule should be applied.
 *
 * On the frontend side, this class is used to reflect the edit made to
 * platform parameter filters in the admin page.
 */
export interface PlatformParameterFilterBackendDict {
  type: PlatformParameterFilterType;
  conditions: [string, string][];
}

export class PlatformParameterFilter {
  type: PlatformParameterFilterType;
  conditions: [string, string][];

  constructor(
    type: PlatformParameterFilterType,
    conditions: [string, string][]
  ) {
    this.type = type;
    this.conditions = conditions;
  }

  static createFromBackendDict(
    platformParameterFiliterBackendDict: PlatformParameterFilterBackendDict
  ): PlatformParameterFilter {
    return new PlatformParameterFilter(
      platformParameterFiliterBackendDict.type,
      platformParameterFiliterBackendDict.conditions
    );
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {PlatformParameterFilterBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): PlatformParameterFilterBackendDict {
    return {
      type: this.type,
      conditions: cloneDeep(this.conditions),
    };
  }
}
