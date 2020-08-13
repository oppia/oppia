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
      FeatureStatusSummaryObjectFactory
  ) {}

  async fetchFeatureFlags(context: ClientContext):
      Promise<FeatureStatusSummary> {
    const backendDict = await this.http.post<FeatureStatusSummaryBackendDict>(
      PlatformFeatureDomainConstants.PLATFORM_FEATURE_HANDLER_URL,
      context.toBackendDict()
    ).toPromise();

    return this.featureStatusSummaryObjectFactory.createFromBackendDict(
      backendDict);
  }
}

angular.module('oppia').factory(
  'PlatformFeatureBackendApiService',
  downgradeInjectable(PlatformFeatureBackendApiService));
