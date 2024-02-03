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
 * @fileoverview Frontend Model for Feature Flag.
*/

export enum FeatureStage {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'prod',
}

export interface FeatureFlagBackendDict {
  'name': string;
  'description': string;
  'feature_stage': FeatureStage;
  'force_enable_for_all_users': boolean;
  'rollout_percentage': number;
  'user_group_ids': string[];
  'last_updated': string | null;
}

/**
 * Frontend domain object representation of feature flags.
 *
 * On the frontend side, this class is used to reflect the edit made to
 * feature flags in the release coordinator page.
 */
export class FeatureFlag {
  readonly name: string;
  readonly description: string;
  readonly featureStage: FeatureStage;
  forceEnableForAllUsers: boolean;
  rolloutPercentage: number;
  userGroupIds: string[];
  lastUpdated: string | null;

  constructor(
      name: string, description: string, featureStage: FeatureStage,
      forceEnableForAllUsers: boolean, rolloutPercentage: number,
      userGroupIds: string[], lastUpdated: string | null) {
    this.name = name;
    this.description = description;
    this.featureStage = featureStage;
    this.forceEnableForAllUsers = forceEnableForAllUsers;
    this.rolloutPercentage = rolloutPercentage;
    this.userGroupIds = userGroupIds;
    this.lastUpdated = lastUpdated;
  }

  static createFromBackendDict(
      backendDict: FeatureFlagBackendDict): FeatureFlag {
    return new FeatureFlag(
      backendDict.name,
      backendDict.description,
      backendDict.feature_stage,
      backendDict.force_enable_for_all_users,
      backendDict.rollout_percentage,
      backendDict.user_group_ids,
      backendDict.last_updated
    );
  }
}
