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

import { FeatureGatingDomainConstants } from
  'domain/feature_gating/feature-gating-domain.constants';
import {
  FeatureFlagResults,
  FeatureFlagResultsObjectFactory,
  FeatureFlagResultsBackendDict,
} from 'domain/feature_gating/FeatureFlagResultsObjectFactory';
import { ClientContext } from
  'domain/feature_gating/ClientContextObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class FeatureGatingBackendApiService {
  constructor(
    private http: HttpClient,
    private featureFlagResultsObjectFactory:
      FeatureFlagResultsObjectFactory
  ) {}

  async fetchFeatureFlags(context: ClientContext):
      Promise<FeatureFlagResults> {
    const backendDict = await this.http.post<FeatureFlagResultsBackendDict>(
      FeatureGatingDomainConstants.FEATURE_GATING_HANDLER_URL,
      context.toBackendDict()
    ).toPromise();

    return this.featureFlagResultsObjectFactory.createFromBackendDict(
      backendDict);
  }
}

angular.module('oppia').factory(
  'FeatureGatingBackendApiService',
  downgradeInjectable(FeatureGatingBackendApiService));
