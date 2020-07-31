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
 * @fileoverview Factory for creating FeatureFlagResults domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface FeatureFlagResultsBackendDict {
  [featureName: string]: boolean;
}

export class FeatureFlagResults {
  data: Map<string, boolean>;

  constructor(data: FeatureFlagResultsBackendDict) {
    this.data = new Map(Object.entries(data));
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {FeatureFlagResultsBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): FeatureFlagResultsBackendDict {
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
   * @param {string} featureName - The name of the feature.
   *
   * @returns {boolean} - The value of the feature flag, true if enabled.
   * @throws {Error} - If the feature with the specified name doesn't exist.
   */
  isFeatureEnabled(featureName: string): boolean {
    if (this.data.has(featureName)) {
      return this.data.get(featureName);
    } else {
      throw new Error(`Feature '${featureName}' not exists.`);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagResultsObjectFactory {
  createFromBackendDict(
      backendDict: FeatureFlagResultsBackendDict): FeatureFlagResults {
    return new FeatureFlagResults(backendDict);
  }
}

angular.module('oppia').factory(
  'FeatureFlagResultsObjectFactory',
  downgradeInjectable(FeatureFlagResultsObjectFactory));
