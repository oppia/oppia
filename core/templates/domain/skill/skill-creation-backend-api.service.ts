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
 * @fileoverview Backend service for creating a new skills
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface IRubricBackend {
  difficulty: string,
  explanations: Array<string>
}

export interface ISkillCreationBackend {
  description: string,
  'explanation_dict': string,
  'linked_topic_ids': string[],
  rubrics: IRubricBackend
}

@Injectable({
  providedIn: 'root'
})
export class SkillCreationBackendApiService {
  constructor(private http: HttpClient) {}

  _createSkill(
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback:(reason?: any) => void,
      description: string, rubrics: IRubricBackend, explanation: string,
      linkedTopicIds: string[]): void {
    let postData:ISkillCreationBackend = {
      description: description,
      linked_topic_ids: linkedTopicIds,
      explanation_dict: explanation,
      rubrics: rubrics
    };
    this.http.post(
      '/skill_editor_handler/create_new', postData).toPromise()
      .then((response: { skillId: string }) => {
        if (successCallback) {
          successCallback({
            skillId: response.skillId
          });
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse.body);
        }
      });
  }

  createSkill(description: string, rubrics: IRubricBackend,
      explanation: string, linkedTopicIds: string[]): PromiseLike<Object> {
    return new Promise((resolve, reject) => {
      this._createSkill(resolve, reject,
        description, rubrics, explanation, linkedTopicIds);
    });
  }
}

angular.module('oppia').factory('SkillCreationBackendApiService',
  downgradeInjectable(SkillCreationBackendApiService));
