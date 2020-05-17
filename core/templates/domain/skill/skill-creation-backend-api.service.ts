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
import { Injectable } from '@angular/core';

import { CsrfTokenService } from 'services/csrf-token.service';

export interface IRubricBackend {
  difficulty: string,
  explanations: Array<string>
}

export interface ISkillCreationBackend {
  description: string,
  'explanation_dict': string,
  'linked_topic_ids': string[],
  rubrics: IRubricBackend,
  filenames: string[]
}

export interface IImageData {
  filename: string,
  imageBlob: Blob
}

@Injectable({
  providedIn: 'root'
})
export class SkillCreationBackendApiService {
  constructor(private csrfTokenService: CsrfTokenService) {}

  /**
   * Sends POST request to create skill.
   * @param {Promise} successCallback - Callback invoked on successful creation
   *  of skill.
   * @param {Promise} errorCallback - Callback invoked when skill creation
   *  fails.
   * @param {string} description - Description of the new skill.
   * @param {Object[]} rubrics - Rubrics for the new skill.
   * @param {string} rubric.difficulty - Difficulty of the rubric.
   * @param {string[]} rubric.explanations - Explanations for the difficulty.
   * @param {string} explanation - Explanation of the skill.
   * @param {string[]} linkedTopicIds - Topic ids linked to the new skill.
   * @param {Object[]} imagesData - Represents the images added to the skill.
   * @param {string} imageData.filename - Filename of the image.
   * @param {Blob} imageData.imageBlob - Image data represented as a Blob.
   */
  _createSkill(
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback:(reason?: any) => void,
      description: string, rubrics: IRubricBackend, explanation: string,
      linkedTopicIds: string[], imagesData: IImageData[]): void {
    let filenames = imagesData.map(obj => obj.filename);
    let postData:ISkillCreationBackend = {
      description: description,
      linked_topic_ids: linkedTopicIds,
      explanation_dict: explanation,
      rubrics: rubrics,
      filenames: filenames
    };
    var form = new FormData();
    form.append('payload', JSON.stringify(postData));
    let imageBlobs = imagesData.map(obj => obj.imageBlob);
    for (let idx in imageBlobs) {
      form.append(filenames[idx], imageBlobs[idx]);
    }
    this.csrfTokenService.initializeToken();
    this.csrfTokenService.getTokenAsync().then(function(token) {
      form.append('csrf_token', token);
      $.ajax({
        url: '/skill_editor_handler/create_new',
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        dataFilter: function(data) {
          // Remove the XSSI prefix.
          var transformedData = data.substring(5);
          return JSON.parse(transformedData);
        },
        dataType: 'text'
      }).done((response: { skillId: string }) => {
        if (successCallback) {
          successCallback({
            skillId: response.skillId
          });
        }
      }).fail((errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse);
        }
      });
    });
  }

  createSkill(description: string, rubrics: IRubricBackend,
      explanation: string, linkedTopicIds: string[], imagesData: IImageData[]
  ): PromiseLike<Object> {
    return new Promise((resolve, reject) => {
      this._createSkill(resolve, reject,
        description, rubrics, explanation, linkedTopicIds, imagesData);
    });
  }
}

angular.module('oppia').factory('SkillCreationBackendApiService',
  downgradeInjectable(SkillCreationBackendApiService));
