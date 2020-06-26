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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SkillDomainConstants } from 'domain/skill/skill-domain.constants';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import cloneDeep from 'lodash/cloneDeep';

import { SkillResponseObjectFactory, SkillResponse,
  ISkillResponseBackendDict } from 'domain/skill/SkillResponseObjectFactory';
import { MultiSkillsResponseObjectFactory, MultiSkillsResponse,
  IMultiSkillsResponseBackendDict } from
  'domain/skill/MultiSkillsResponseObjectFactory';


export interface ISkillUpdatePayload {
  'version': number,
  'commitMessage': string,
  'changeDicts': Array<IChangeDict>
}

export interface IChangeDict {
  'cmd'?: string;
  'propertyName'?: string;
  'oldValue'?: string;
  'newValue'?: string;
}

@Injectable ({
  providedIn: 'root'
})
export class SkillBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolation: UrlInterpolationService,
    private skillResponseObjectFactory: SkillResponseObjectFactory,
    private multiSkillsResponseObjectFactory: MultiSkillsResponseObjectFactory
  ) {}

  private _fetchSkill(
      skillId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    let skillDataUrl = this.urlInterpolation.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      });

    this.http.get<ISkillResponseBackendDict>(
      skillDataUrl).toPromise().then(
      (response) => {
        let skill = cloneDeep(response.skill);
        let groupedSkillSummaryDicts = cloneDeep(
          response.grouped_skill_summaries);
        if (successCallback) {
          successCallback(this.skillResponseObjectFactory.createFromBackendDict(
            {skill: skill,
              grouped_skill_summaries: groupedSkillSummaryDicts}));
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _fetchMultiSkills(
      skillIds: Array<string>,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    let skillDataUrl = this.urlInterpolation.interpolateUrl(
      SkillDomainConstants.SKILL_DATA_URL_TEMPLATE, {
        comma_separated_skill_ids: skillIds.join(',')
      });

    this.http.get<IMultiSkillsResponseBackendDict>(
      skillDataUrl).toPromise().then(
      (response) => {
        let skills = cloneDeep(response.skills);
        if (successCallback) {
          successCallback(this.multiSkillsResponseObjectFactory.
            createFromBackendDict({
              skills: skills}));
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _updateSkill(
      skillId: string, skillVersion: number, commitMessage: string,
      changeList: Array<IChangeDict>,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    let editableSkillDataUrl = this.urlInterpolation.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      });

    let putData: ISkillUpdatePayload = {
      version: skillVersion,
      commitMessage: commitMessage,
      changeDicts: changeList
    };


    this.http.put<ISkillResponseBackendDict>(
      editableSkillDataUrl, putData).toPromise().then(
      (response) => {
        let skill = cloneDeep(response.skill);
        if (successCallback) {
          successCallback(skill);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  private _deleteSkill(
      skillId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: string) => void): void {
    let skillDataUrl = this.urlInterpolation.interpolateUrl(
      SkillDomainConstants.EDITABLE_SKILL_DATA_URL_TEMPLATE, {
        skill_id: skillId
      });


    this.http['delete'](
      skillDataUrl, { observe: 'response' }).toPromise().then(
      (response) => {
        if (successCallback) {
          successCallback(response.status);
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.error);
        }
      });
  }

  fetchSkill(skillId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchSkill(skillId, resolve, reject);
    });
  }

  fetchMultiSkills(skillIds: Array<string>): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchMultiSkills(skillIds, resolve, reject);
    });
  }

  updateSkill(
      skillId: string, skillVersion: number, commitMessage: string,
      changeList: Array<IChangeDict>
  ): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._updateSkill(skillId, skillVersion, commitMessage,
        changeList, resolve, reject);
    });
  }

  deleteSkill(skillId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._deleteSkill(skillId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'SkillBackendApiService', downgradeInjectable(SkillBackendApiService));
