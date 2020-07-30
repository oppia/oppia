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
 * @fileoverview Factory for creating PlatformParameterResult domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { PlatformParameterValue } from './PlatformParameterRuleObjectFactory';

export interface PlatformParameterResultBackendDict {
  [paramName: string]: PlatformParameterValue;
}

export class PlatformParameterResult {
  data: Map<string, PlatformParameterValue>;

  constructor(data: PlatformParameterResultBackendDict) {
    this.data = new Map(Object.entries(data));
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {PlatformParameterResultBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): PlatformParameterResultBackendDict {
    const backendDict = {};
    for (const [key, value] of this.data.entries()) {
      backendDict[key] = value;
    }
    return backendDict;
  }

  /**
   * Parse an expression. Returns a node tree, which can be evaluated by
   * invoking node.eval().
   *
   * @param {string} paramName - The name of the parameter.
   *
   * @returns {PlatformParameterValue} - The value of the parameter
   * @throws {Error} - If the parameter with the specified name doesn't exist.
   */
  getPlatformParameterValue(paramName: string): PlatformParameterValue {
    if (this.data.has(paramName)) {
      return this.data.get(paramName);
    } else {
      throw new Error(`Platform parameter '${paramName}' not exists.`);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlatformParameterResultObjectFactory {
  createFromBackendDict(
      backendDict: PlatformParameterResultBackendDict):
      PlatformParameterResult {
    return new PlatformParameterResult(backendDict);
  }
}

angular.module('oppia').factory(
  'PlatformParameterResultObjectFactory',
  downgradeInjectable(PlatformParameterResultObjectFactory));
