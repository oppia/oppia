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
import { PlatformParameterRule, PlatformParameterValue } from
  'domain/platform_feature/platform-parameter-rule.model';
import {
  PlatformParameter,
  PlatformParameterBackendDict
} from 'domain/platform_feature/platform-parameter.model';

export interface FeatureFlagsDicts {
  'feature_flags': PlatformParameterBackendDict[];
  'server_stage': string;
}

export interface FeatureFlagsResponse {
  featureFlags: PlatformParameter[];
  serverStage: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformFeatureAdminBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  async getFeatureFlags(): Promise<FeatureFlagsResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<FeatureFlagsDicts>(
        PlatformFeatureDomainConstants.FEATURE_FLAGS_URL
      ).toPromise().then(response => {
        resolve({
          featureFlags: response.feature_flags.map(
            dict => PlatformParameter.createFromBackendDict(
              dict)),
          serverStage: response.server_stage
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async updateFeatureFlag(
      name: string, message: string, newRules: PlatformParameterRule[]
  ):
      Promise<void> {
    await this.http.post(
      PlatformFeatureDomainConstants.FEATURE_FLAGS_URL,
      {
        action: PlatformFeatureDomainConstants.UPDATE_FEATURE_FLAG_ACTION,
        feature_name: name,
        commit_message: message,
        new_rules: newRules.map(rule => rule.toBackendDict())
      }
    ).toPromise();
  }

  async updatePlatformParameter(
      name: string, message: string, newRules: PlatformParameterRule[],
      defaultValue: PlatformParameterValue
  ):
      Promise<void> {
    await this.http.post(
      AdminPageConstants.ADMIN_HANDLER_URL,
      {
        action: (
          PlatformFeatureDomainConstants.
            UPDATE_PLATFORM_PARAMETER_RULES_ACTION),
        platform_param_name: name,
        commit_message: message,
        new_rules: newRules.map(rule => rule.toBackendDict()),
        // The default_value is being sent as a map in order to handle the
        // schema in the backend. The default value can be of type number,
        // string and boolean and to handle this part we are passing a map
        // so we can declare the schema for the incoming value as a map and
        // then further validate the actual value.
        default_value: {value: defaultValue}
      }
    ).toPromise();
  }
}

angular.module('oppia').factory(
  'PlatformFeatureAdminBackendApiService',
  downgradeInjectable(PlatformFeatureAdminBackendApiService));
