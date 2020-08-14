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
 * @fileoverview Factory for creating FeatureStatusSummary domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface FeatureStatusSummaryBackendDict {
  [featureName: string]: boolean;
}

/**
 * Represents the evaluation result summary of all feature flags received from
 * the server. This is used only in the frontend feature value retrieval.
 */
export class FeatureStatusSummary {
  featureNameToFlag: Map<string, boolean>;

  constructor(backendDict: FeatureStatusSummaryBackendDict) {
    this.featureNameToFlag = new Map(Object.entries(backendDict));
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {FeatureStatusSummaryBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): FeatureStatusSummaryBackendDict {
    const backendDict = {};
    for (const [key, value] of this.featureNameToFlag.entries()) {
      backendDict[key] = value;
    }
    return backendDict;
  }

  /**
   * Gets the value of a feature flag in the result.
   *
   * @param {string} featureName - The name of the feature.
   *
   * @returns {boolean} - The value of the feature flag, true if enabled.
   * @throws {Error} - If the feature with the specified name doesn't exist.
   */
  isFeatureEnabled(featureName: string): boolean {
    if (!this.featureNameToFlag.has(featureName)) {
      throw new Error(`Feature '${featureName}' does not exist.`);
    }
    return this.featureNameToFlag.get(featureName);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeatureStatusSummaryObjectFactory {
  createFromBackendDict(
      backendDict: FeatureStatusSummaryBackendDict): FeatureStatusSummary {
    return new FeatureStatusSummary(backendDict);
  }
}

angular.module('oppia').factory(
  'FeatureStatusSummaryObjectFactory',
  downgradeInjectable(FeatureStatusSummaryObjectFactory));
