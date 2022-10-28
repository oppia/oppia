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

import { ClientContext } from
  'domain/platform_feature/client-context.model';
import {
  FeatureStatusSummary,
  FeatureStatusSummaryBackendDict,
} from 'domain/platform_feature/feature-status-summary.model';
import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';

@Injectable({
  providedIn: 'root'
})
export class PlatformFeatureBackendApiService {
  constructor(
    private http: HttpClient
  ) {}

  /**
   * Gets the feature flags.
   *
   * @param {ClientContext} context - The client side context for feature flag
   * evlauation.
   *
   * @returns {Promise<FeatureStatusSummary>} - A promise that resolves to
   * the feature status summary.
   */
  async fetchFeatureFlags(context: ClientContext):
      Promise<FeatureStatusSummary> {
    const backendDict = await this.http.get<FeatureStatusSummaryBackendDict>(
      PlatformFeatureDomainConstants.PLATFORM_FEATURES_EVALUATION_HANDLER_URL,
      {
        params: {...context.toBackendDict()}
      }
    ).toPromise();

    return FeatureStatusSummary.createFromBackendDict(
      backendDict);
  }
}

angular.module('oppia').factory(
  'PlatformFeatureBackendApiService',
  downgradeInjectable(PlatformFeatureBackendApiService));
