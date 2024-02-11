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
 * @fileoverview Unit tests for FeatureStatusSummary.
 */

import { FeatureStatusSummary, FeatureNames } from
  'domain/feature-flag/feature-status-summary.model';

describe('Feature Status Summary Model', () => {
  it('should create an instance from a backend dict.', () => {
    const summary = FeatureStatusSummary.createFromBackendDict({
      [FeatureNames.DummyFeatureFlagForE2ETests]: true,
    });

    expect(summary.featureNameToFlag.size).toBe(1);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict = {
      [FeatureNames.DummyFeatureFlagForE2ETests]: true,
    };
    const summary = FeatureStatusSummary.createFromBackendDict(backendDict);
    expect(summary.toBackendDict()).toEqual(backendDict);
  });

  describe('.isFeatureEnabled', () => {
    it('should return the value of the parameter', () => {
      const summary = FeatureStatusSummary.createFromBackendDict({
        [FeatureNames.DummyFeatureFlagForE2ETests]: true
      });
      const checker = summary.toStatusChecker();

      expect(checker.DummyFeatureFlagForE2ETests.isEnabled).toBeTrue();
    });

    it('should throw if the feature status is missing in backend dict.', () => {
      const summary = FeatureStatusSummary.createFromBackendDict({});
      const checker = summary.toStatusChecker();

      expect(
        () => checker.DummyFeatureFlagForE2ETests.isEnabled
      ).toThrowError(
        `Feature \'${
          FeatureNames.DummyFeatureFlagForE2ETests}\' does not exist.`);
    });
  });
});
