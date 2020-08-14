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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import {
  FeatureStatusSummary,
  FeatureStatusSummaryBackendDict,
  FeatureStatusSummaryObjectFactory,
} from 'domain/platform_feature/feature-status-summary-object.factory';
import { ClientContext } from
  'domain/platform_feature/client-context-object.factory';

@Injectable({
  providedIn: 'root'
})
export class PlatformFeatureBackendApiService {
  constructor(
    private http: HttpClient,
    private featureStatusSummaryObjectFactory:
      FeatureStatusSummaryObjectFactory,
  ) {}

  /**
   * Gets the feature flags.
   *
   * @param {ClientContext} context - The client side context for feature flag
   * evlauation.
   *
   * @returns {Promise>FeatureStatusSummary} - A promise that resolves to
   * the feature status summary.
   */
  async fetchFeatureFlags(context: ClientContext):
      Promise<FeatureStatusSummary> {
    // Manual construct of FormData is needed here since this service is used
    // before the installation of RequestInterceptor.
    const body = new FormData();
    body.append('payload', JSON.stringify(context.toBackendDict()));
    body.append('csrf_token', await this.getCsrfTokenAsync());
    body.append('source', document.URL);

    const backendDict = await this.http.post<FeatureStatusSummaryBackendDict>(
      PlatformFeatureDomainConstants.PLATFORM_FEATURE_HANDLER_URL, body
    ).toPromise();

    return this.featureStatusSummaryObjectFactory.createFromBackendDict(
      backendDict);
  }

  /**
   * Request for csrf token. CsrfTokenService is not used in this service
   * because this service is used prior to the initialization of
   * CsrfTokenService.
   *
   * @returns {Promise<string>} - A promise that resolves to the csrf token.
   */
  private async getCsrfTokenAsync(): Promise<string> {
    const res = await this.http.get<{token: string}>(
      '/csrfhandler').toPromise();
    return res.token;
  }
}

angular.module('oppia').factory(
  'PlatformFeatureBackendApiService',
  downgradeInjectable(PlatformFeatureBackendApiService));
