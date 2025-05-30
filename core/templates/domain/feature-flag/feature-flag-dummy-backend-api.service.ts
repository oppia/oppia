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
 * @fileoverview Service to check the status of dummy handler in backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {FeatureFlagDomainConstants} from 'domain/feature-flag/feature-flag-domain.constants';

interface Response {
  is_enabled: boolean;
  msg: string;
}

/**
 * Api service for the backend dummy handler that is gated by the
 * dummy_feature_flag_for_e2e_tests. This api is used for testing the
 * end-to-end feature gating flow.
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureFlagDummyBackendApiService {
  constructor(private http: HttpClient) {}

  /**
   * Checks if the dummy handler gated by dummy_feature_flag_for_e2e_tests
   * is enabled.
   *
   * @returns {Promise<boolean>} - A promise that resolves to true if request
   * to the dummy handler succeeded without error.
   */
  async isHandlerEnabled(): Promise<boolean> {
    const response = (await this.http
      .get(FeatureFlagDomainConstants.DUMMY_HANDLER_URL)
      .toPromise()) as Response;
    return response.is_enabled === true;
  }
}
