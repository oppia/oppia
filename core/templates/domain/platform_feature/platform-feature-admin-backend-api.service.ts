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
 * @fileoverview Service for admin to update feature flag rules.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AdminPageConstants } from
  'pages/admin-page/admin-page.constants';
import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import { PlatformParameterRule } from
  'domain/platform_feature/platform-parameter-rule.model';

@Injectable({
  providedIn: 'root'
})
export class PlatformFeatureAdminBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  async updateFeatureFlag(
      name: string, message: string, newRules: PlatformParameterRule[]):
      Promise<void> {
    await this.http.post(
      AdminPageConstants.ADMIN_HANDLER_URL,
      {
        action: PlatformFeatureDomainConstants.UPDATE_FEATURE_FLAG_RULES_ACTION,
        feature_name: name,
        commit_message: message,
        new_rules: newRules.map(rule => rule.toBackendDict())
      }
    ).toPromise();
  }
}

angular.module('oppia').factory(
  'PlatformFeatureAdminBackendApiService',
  downgradeInjectable(PlatformFeatureAdminBackendApiService));
