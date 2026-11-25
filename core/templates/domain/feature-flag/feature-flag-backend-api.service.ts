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
 * @fileoverview Service to get feature flags.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {
  FeatureStatusSummary,
  FeatureStatusSummaryBackendDict,
} from 'domain/feature-flag/feature-status-summary.model';
import {FeatureFlagDomainConstants} from 'domain/feature-flag/feature-flag-domain.constants';
import {
  FeatureFlag,
  FeatureFlagBackendDict,
} from 'domain/feature-flag/feature-flag.model';
import {UserGroupBackendDict} from 'domain/release_coordinator/user-group.model';
import {UserGroup} from 'domain/release_coordinator/user-group.model';

export interface FeatureFlagsDicts {
  feature_flags: FeatureFlagBackendDict[];
  server_stage: string;
  user_group_dicts: UserGroupBackendDict[];
}

export interface FeatureFlagsResponse {
  featureFlags: FeatureFlag[];
  serverStage: string;
  userGroups: UserGroup[];
}

export interface FeatureFlagConfigValuesBackendDict {
  force_enable_for_all_users: boolean;
  rollout_percentage: number;
  user_group_ids: string[];
}

export interface FeatureFlagChangeBackendDict {
  // The username is null if the committer's account has been deleted.
  committer_username: string | null;
  old_config: FeatureFlagConfigValuesBackendDict;
  new_config: FeatureFlagConfigValuesBackendDict;
  created_on_msecs: number;
}

interface FeatureFlagHistoryBackendResponse {
  feature_flag_changes: FeatureFlagChangeBackendDict[];
}

export interface FeatureFlagConfigValues {
  forceEnableForAllUsers: boolean;
  rolloutPercentage: number;
  userGroupIds: string[];
}

export interface FeatureFlagChange {
  committerUsername: string | null;
  oldConfig: FeatureFlagConfigValues;
  newConfig: FeatureFlagConfigValues;
  createdOnMsecs: number;
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagBackendApiService {
  constructor(private http: HttpClient) {}

  /**
   * Gets the feature flags.
   *
   * @returns {Promise<FeatureStatusSummary>} - A promise that resolves to
   * the feature status summary.
   */
  async fetchFeatureFlags(): Promise<FeatureStatusSummary> {
    const backendDict = await this.http
      .get<FeatureStatusSummaryBackendDict>(
        FeatureFlagDomainConstants.FEATURE_FLAGS_EVALUATION_HANDLER_URL
      )
      .toPromise();

    return FeatureStatusSummary.createFromBackendDict(backendDict);
  }

  /**
   * Gets the feature flags to display on release-coordinator page.
   *
   * @returns {Promise<FeatureFlagsResponse>} - A promise that resolves to
   * the feature flag response.
   */
  async getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return new Promise((resolve, reject) => {
      this.http
        .get<FeatureFlagsDicts>(FeatureFlagDomainConstants.FEATURE_FLAGS_URL)
        .toPromise()
        .then(
          response => {
            resolve({
              featureFlags: response.feature_flags.map(dict =>
                FeatureFlag.createFromBackendDict(dict)
              ),
              serverStage: response.server_stage,
              userGroups: response.user_group_dicts.map(dict =>
                UserGroup.createFromBackendDict(dict)
              ),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  /**
   * Update feature flag present on release-coordinator page.
   */
  async updateFeatureFlag(
    name: string,
    forceEnableForAllUsers: boolean,
    rolloutPercentage: number,
    userGroupIds: string[]
  ): Promise<void> {
    await this.http
      .put(FeatureFlagDomainConstants.FEATURE_FLAGS_URL, {
        action: FeatureFlagDomainConstants.UPDATE_FEATURE_FLAG_ACTION,
        feature_flag_name: name,
        force_enable_for_all_users: forceEnableForAllUsers,
        rollout_percentage: rolloutPercentage,
        user_group_ids: userGroupIds,
      })
      .toPromise();
  }

  /**
   * Gets the change history of a feature flag, most recent change first.
   *
   * @param {string} name - The name of the feature flag.
   * @returns {Promise<FeatureFlagChange[]>} - A promise that resolves to the
   * list of changes made to the feature flag.
   */
  async fetchFeatureFlagHistoryAsync(
    name: string
  ): Promise<FeatureFlagChange[]> {
    const response = await this.http
      .get<FeatureFlagHistoryBackendResponse>(
        `${FeatureFlagDomainConstants.FEATURE_FLAG_HISTORY_URL_PREFIX}/` +
          encodeURIComponent(name)
      )
      .toPromise();
    return response.feature_flag_changes.map(change => ({
      committerUsername: change.committer_username,
      oldConfig: this._convertConfigValues(change.old_config),
      newConfig: this._convertConfigValues(change.new_config),
      createdOnMsecs: change.created_on_msecs,
    }));
  }

  private _convertConfigValues(
    configDict: FeatureFlagConfigValuesBackendDict
  ): FeatureFlagConfigValues {
    return {
      forceEnableForAllUsers: configDict.force_enable_for_all_users,
      rolloutPercentage: configDict.rollout_percentage,
      userGroupIds: configDict.user_group_ids,
    };
  }
}
