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
 * @fileoverview Service to send changes to a skill to the backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { SkillDomainConstants } from
  'domain/skill/skill-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';

// TODO(#7165): Replace any with exact type.
interface editableSkillResponseConfig {
    skill?: any;
    skills?: any;
    // eslint-disable-next-line camelcase
    grouped_skill_summaries?: any;
}
@Injectable({
  providedIn: 'root'
})
export class EditableSkillBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchSkill(
      skillId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    const skillDataUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      }
    );
    this.http.get(skillDataUrl).toPromise().then(
      (data: editableSkillResponseConfig) => successCallback({
        skill: data.skill,
        groupedSkillSummaries: data.grouped_skill_summaries
      }),
      error => {
        if (errorCallback) {
          errorCallback(error.error);
        }
      }
    );
  }

  private _fetchMultiSkills(
      skillIds: [string],
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    const skillDataUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.SKILL_DATA_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(',')
      }
    );
    this.http.get(skillDataUrl).toPromise().then(
      (data: editableSkillResponseConfig) => successCallback(data.skills),
      error => {
        if (errorCallback) {
          errorCallback(error.error);
        }
      }
    );
  }
  private _updateSkill(
      skillId: string, skillVersion: number, commitMessage: string,
      changeList: [any],
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    const editableSkillDataUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      }
    );

    const putData = {
      version: skillVersion,
      commit_message: commitMessage,
      change_dicts: changeList
    };

    this.http.put(
      editableSkillDataUrl, putData
    ).toPromise().then(
      (data: editableSkillResponseConfig) => successCallback(data.skill),
      error => {
        if (errorCallback) {
          errorCallback(error.error);
        }
      }
    );
  }

  private _deleteSkill(
      skillId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    const skillDataUrl = this.urlInterpolationService.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      });
    this.http['delete'](skillDataUrl, { observe: 'response' }).toPromise().then(
      (res) => successCallback(res.status),
      (error) => {
        if (errorCallback) {
          errorCallback(error.error);
        }
      }
    );
  }

  fetchSkill(skillId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchSkill(skillId, resolve, reject);
    });
  }

  fetchMultiSkills(skillIds: [string]): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchMultiSkills(skillIds, resolve, reject);
    });
  }

  updateSkill(
      skillId: string, skillVersion: number, commitMessage: string,
      changeList: [any]
  ): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._updateSkill(
        skillId, skillVersion, commitMessage, changeList, resolve, reject
      );
    });
  }

  deleteSkill(skillId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._deleteSkill(skillId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'EditableSkillBackendApiService',
  downgradeInjectable(EditableSkillBackendApiService));
