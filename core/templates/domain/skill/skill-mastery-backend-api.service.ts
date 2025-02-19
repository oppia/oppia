// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to skill mastery to the backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {SkillDomainConstants} from 'domain/skill/skill-domain.constants';
import {
  SkillMastery,
  SkillMasteryBackendDict,
} from 'domain/skill/skill-mastery.model';

export interface SkillMasteryBackendResponse {
  degrees_of_mastery: SkillMasteryBackendDict;
}

@Injectable({
  providedIn: 'root',
})
export class SkillMasteryBackendApiService {
  constructor(private httpClient: HttpClient) {}

  _fetchSkillMasteryDegrees(
    skillIds: string[],
    successCallback: (value: SkillMastery) => void,
    errorCallback: (reason: string) => void
  ): void {
    this.httpClient
      .get<SkillMasteryBackendResponse>(
        SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE,
        {
          params: {
            selected_skill_ids: JSON.stringify(skillIds),
          },
        }
      )
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            let skillMastery = SkillMastery.createFromBackendDict(
              response.degrees_of_mastery
            );
            successCallback(skillMastery);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  _updateSkillMasteryDegrees(
    masteryPerSkillMapping: {[key: string]: number},
    successCallback: () => void,
    errorCallback: (reason: string) => void
  ): void {
    let putData = {
      mastery_change_per_skill: masteryPerSkillMapping,
    };

    this.httpClient
      .put(SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE, putData)
      .toPromise()
      .then(
        () => {
          if (successCallback) {
            successCallback();
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  async fetchSkillMasteryDegreesAsync(
    skillIds: string[]
  ): Promise<SkillMastery> {
    return new Promise((resolve, reject) => {
      this._fetchSkillMasteryDegrees(skillIds, resolve, reject);
    });
  }

  async updateSkillMasteryDegreesAsync(masteryPerSkillMapping: {
    [key: string]: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this._updateSkillMasteryDegrees(masteryPerSkillMapping, resolve, reject);
    });
  }
}
