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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import {
  FeatureStatusSummary,
  FeatureStatusSummaryBackendDict,
} from 'domain/feature-flag/feature-status-summary.model';
import { FeatureFlagDomainConstants } from
  'domain/feature-flag/feature-flag-domain.constants';
import {
  FeatureFlag,
  FeatureFlagBackendDict
} from 'domain/feature-flag/feature-flag.model';

export interface FeatureFlagsDicts {
  'feature_flags': FeatureFlagBackendDict[];
  'server_stage': string;
}

export interface FeatureFlagsResponse {
  featureFlags: FeatureFlag[];
  serverStage: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagBackendApiService {
  constructor(
    private http: HttpClient
  ) {}

  /**
   * Gets the feature flags.
   *
   * @returns {Promise<FeatureStatusSummary>} - A promise that resolves to
   * the feature status summary.
   */
  async fetchFeatureFlags():
      Promise<FeatureStatusSummary> {
    const backendDict = await this.http.get<FeatureStatusSummaryBackendDict>(
      FeatureFlagDomainConstants.FEATURE_FLAGS_EVALUATION_HANDLER_URL
    ).toPromise();

    return FeatureStatusSummary.createFromBackendDict(
      backendDict);
  }

  /**
   * Gets the feature flags to display on release-coordinator page.
   *
   * @returns {Promise<FeatureFlagsResponse>} - A promise that resolves to
   * the feature flag response.
   */
  async getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<FeatureFlagsDicts>(
        FeatureFlagDomainConstants.FEATURE_FLAGS_URL
      ).toPromise().then(response => {
        resolve({
          featureFlags: response.feature_flags.map(
            dict => FeatureFlag.createFromBackendDict(
              dict)),
          serverStage: response.server_stage
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  /**
   * Update feature flag present on release-coordinator page.
   */
  async updateFeatureFlag(
      name: string, forceEnableForAllUsers: boolean, rolloutPercentage: number,
      userGroupIds: string[]
  ):
      Promise<void> {
    await this.http.put(
      FeatureFlagDomainConstants.FEATURE_FLAGS_URL,
      {
        action: FeatureFlagDomainConstants.UPDATE_FEATURE_FLAG_ACTION,
        feature_flag_name: name,
        force_enable_for_all_users: forceEnableForAllUsers,
        rollout_percentage: rolloutPercentage,
        user_group_ids: userGroupIds
      }
    ).toPromise();
  }
}

angular.module('oppia').factory(
  'FeatureFlagBackendApiService',
  downgradeInjectable(FeatureFlagBackendApiService));
