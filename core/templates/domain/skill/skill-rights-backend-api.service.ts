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
 * @fileoverview Service to change the rights of skills in the backend.
 */

export interface ISkillRightCache {
  [propName: string]: ISkillRightBackend
}

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { cloneDeep } from 'lodash';

import { ISkillRightBackend } from
  'domain/skill/SkillRightsObjectFactory.ts';
import { SkillEditorPageConstants } from
  'pages/skill-editor-page/skill-editor-page.constants.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class SkillRightsBackendApiService {
  skillRightsCache: ISkillRightCache = {};
  skillRightBackendDict: ISkillRightBackend = null;

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  _fetchSkillRights(skillId:string, successCallback, errorCallback): void {
    let skillRightsUrl = this.urlInterpolationService.interpolateUrl(
      SkillEditorPageConstants.SKILL_RIGHTS_URL_TEMPLATE, {
        skill_id: skillId
      });

    this.http.get(skillRightsUrl, { observe: 'response' }).toPromise()
      .then((response) => {
        if (successCallback) {
          successCallback(response.body);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.body);
        }
      });
  }

  _isCached(skillId: string): boolean {
    return this.skillRightsCache.hasOwnProperty(skillId);
  }
  /**
    * Gets a skill's rights, given its ID.
    */
  fetchSkillRights(skillId: string): Promise<ISkillRightBackend> {
    return new Promise((resolve, reject) => {
      this._fetchSkillRights(skillId, resolve, reject);
    });
  }
  /**
    * Behaves exactly as fetchSkillRights (including callback
    * behavior and returning a promise object), except this function will
    * attempt to see whether the given skill rights has been
    * cached. If it has not yet been cached, it will fetch the skill
    * rights from the backend. If it successfully retrieves the skill
    * rights from the backend, it will store it in the cache to avoid
    * requests from the backend in further function calls.
    */
  loadSkillRights(skillId: string): Promise<ISkillRightBackend> {
    return new Promise((resolve, reject) => {
      if (this._isCached(skillId)) {
        if (resolve) {
          resolve(this.skillRightsCache[skillId]);
        }
      } else {
        this._fetchSkillRights(skillId,
          (skillRights: ISkillRightBackend) => {
            this.cacheSkillRights(skillId, skillRights);
            if (resolve) {
              resolve(this.skillRightsCache[skillId]);
            }
          }, reject);
      }
    });
  }

  isCached(skillId: string): boolean {
    return this._isCached(skillId);
  }

  cacheSkillRights(skillId: string, skillRights: ISkillRightBackend): void {
    this.skillRightsCache[skillId] = cloneDeep(skillRights);
  }
}

angular.module('oppia').factory('SkillRightsBackendApiService',
  downgradeInjectable(SkillRightsBackendApiService));
