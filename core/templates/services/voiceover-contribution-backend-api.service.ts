// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The backend API service to fetch voiceover contribution is
 * enabled data.
 */

import {downgradeInjectable} from '@angular/upgrade/static';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ServicesConstants} from 'services/services.constants';

export interface VoiceoverContributionBackendDict {
  voiceover_contribution_enabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceoverContributionBackendApiService {
  constructor(private http: HttpClient) {}

  async getVoiceoverContributionDataAsync(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.http
        .get<VoiceoverContributionBackendDict>(
          ServicesConstants.VOICEOVER_CONTRIBUTION_IS_ENABLED_URL,
          {}
        )
        .toPromise()
        .then(
          response => {
            resolve(response.voiceover_contribution_enabled);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateVoiceoverContributionDataAsync(
    voiceoverContributionEnabled: boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http
        .put<VoiceoverContributionBackendDict>(
          ServicesConstants.VOICEOVER_CONTRIBUTION_IS_ENABLED_URL,
          {
            voiceover_contribution_enabled: voiceoverContributionEnabled,
          }
        )
        .toPromise()
        .then(
          () => {
            resolve();
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}

angular
  .module('oppia')
  .factory(
    'VoiceoverContributionBackendApiService',
    downgradeInjectable(VoiceoverContributionBackendApiService)
  );
