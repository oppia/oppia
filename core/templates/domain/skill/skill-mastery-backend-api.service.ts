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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { SkillDomainConstants } from 'domain/skill/skill-domain.constants';
import { SkillMasteryObjectFactory, SkillMastery } from
  './SkillMasteryObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class SkillMasteryBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private skillMasteryObjectFactory: SkillMasteryObjectFactory) {}

  _fetchSkillMasteryDegrees(skillIds: Array<string>,
      successCallback: (
        value?: SkillMastery | PromiseLike<SkillMastery>
      ) => void,
      errorCallback: (reason?: any) => void): void {
    this.httpClient.get(SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE, {
      params: {
        comma_separated_skill_ids: skillIds.join(',')
      }
    }).toPromise().then((response: any) => {
      if (successCallback) {
        let skillMastery = (
          this.skillMasteryObjectFactory.createFromBackendDict(
            response.degrees_of_mastery));
        successCallback(skillMastery);
      }
    }, (errorResponse) =>{
      if (errorCallback) {
        errorCallback(errorResponse);
      }
    });
  }

  _updateSkillMasteryDegrees(masteryPerSkillMapping: {[key: string]: number},
      successCallback: (
        value?: SkillMastery | PromiseLike<SkillMastery>
      ) => void,
      errorCallback: (reason?: any) => void): void {
    let putData = {
      mastery_change_per_skill: masteryPerSkillMapping
    };

    this.httpClient.put(SkillDomainConstants.SKILL_MASTERY_DATA_URL_TEMPLATE,
      putData).toPromise().then((response: any) => {
      if (successCallback) {
        successCallback();
      }
    }, (errorResponse) => {
      if (errorCallback) {
        errorCallback(errorResponse);
      }
    });
  }

  fetchSkillMasteryDegrees(skillIds: Array<string>): Promise<SkillMastery> {
    return new Promise((resolve, reject) => {
      this._fetchSkillMasteryDegrees(skillIds, resolve, reject);
    });
  }

  updateSkillMasteryDegrees(
      masteryPerSkillMapping: {[key: string]: number}): Promise<SkillMastery> {
    return new Promise((resolve, reject) => {
      this._updateSkillMasteryDegrees(masteryPerSkillMapping, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'SkillMasteryBackendApiService',
  downgradeInjectable(SkillMasteryBackendApiService));
