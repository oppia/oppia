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
 * @fileoverview Unit tests for PlatformParameterResultObjectFactory.
 */

import { TestBed } from '@angular/core/testing';
import { FeatureFlagResultsObjectFactory } from
  './feature-flag-results-object.factory';

describe('FeatureFlagResultsObjectFactory', () => {
  let factory: FeatureFlagResultsObjectFactory;

  beforeEach(() => {
    factory = TestBed.get(FeatureFlagResultsObjectFactory);
  });

  it('should create an instance from a backend dict.', () => {
    const result = factory.createFromBackendDict({
      feature_name_a: true,
      feature_name_b: false
    });

    expect(result.data.size).toBe(2);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict = {
      feature_name_a: true,
      feature_name_b: false
    };
    const result = factory.createFromBackendDict(backendDict);
    expect(result.toBackendDict()).toEqual(backendDict);
  });

  describe('.isFeatureEnabled', () => {
    it('should return the value of the parameter', () => {
      const result = factory.createFromBackendDict({
        feature_name_a: true,
        feature_name_b: false
      });

      expect(result.isFeatureEnabled('feature_name_a')).toBeTrue();
      expect(result.isFeatureEnabled('feature_name_b')).toBeFalse();
    });

    it('should throw if the feature does not exist.', () => {
      const result = factory.createFromBackendDict({
        feature_name_a: true,
        feature_name_b: false
      });

      expect(
        () => result.isFeatureEnabled('invalid_name')
      ).toThrowError('Feature \'invalid_name\' does not exist.');
    });
  });
});
