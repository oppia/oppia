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
  [propName: string]: ISkillRightBackendInterface
}
import { cloneDeep } from 'lodash';
import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISkillRightBackendInterface } from
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
  skillRightBackendDict: ISkillRightBackendInterface = null;

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) { }

  _fetchSkillRights(skillId, successCallback, errorCallback) {
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

  _isCached(skillId: string) {
    return this.skillRightsCache.hasOwnProperty(skillId);
  }

  fetchSkillRights(skillId: string) {
    return new Promise((resolve, reject) => {
      this._fetchSkillRights(skillId, resolve, reject);
    });
  }

  loadSkillRights(skillId: string) {
    return new Promise((resolve, reject) => {
      if (this._isCached(skillId)) {
        if (resolve) {
          resolve(this.skillRightsCache[skillId]);
        }
      } else {
        this._fetchSkillRights(skillId,
          (skillRights: ISkillRightBackendInterface) => {
            this.skillRightsCache[skillId] = skillRights;
            if (resolve) {
              resolve(this.skillRightsCache[skillId]);
            }
          }, reject);
      }
    });
  }

  isCached(skillId: string) {
    return this._isCached(skillId);
  }

  cacheSkillRights(skillId: string, skillRights: ISkillRightBackendInterface) {
    this.skillRightsCache[skillId] = cloneDeep(skillRights);
  }
}
angular.module('oppia').factory('SkillRightsBackendApiService',
  downgradeInjectable(SkillRightsBackendApiService));
