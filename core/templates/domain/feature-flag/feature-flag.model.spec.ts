// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeatureFlagModel.
 */

import {
  FeatureFlag,
  FeatureStage,
} from 'domain/feature-flag/feature-flag.model';

describe('FeatureFlagModel', () => {
  it('should create an instance from a backend dict.', () => {
    const feature = FeatureFlag.createFromBackendDict({
      name: 'feature name',
      description: 'This is a feature for test.',
      feature_stage: FeatureStage.DEV,
      force_enable_for_all_users: true,
      rollout_percentage: 0,
      user_group_ids: [],
      last_updated: 'September 4, 2023',
    });

    expect(feature.name).toEqual('feature name');
    expect(feature.description).toEqual('This is a feature for test.');
    expect(feature.featureStage).toEqual('dev');
    expect(feature.forceEnableForAllUsers).toBeTrue();
    expect(feature.rolloutPercentage).toEqual(0);
    expect(feature.userGroupIds).toEqual([]);
    expect(feature.lastUpdated).toEqual('September 4, 2023');
  });
});
