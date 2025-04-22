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

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {ImageLocalStorageService} from 'services/image-local-storage.service';

export interface RubricBackendDict {
  difficulty: string;
  explanations: string[];
}

export interface SkillCreationBackendDict {
  description: string;
  explanation_dict: string;
  linked_topic_ids: string[];
  rubrics: RubricBackendDict;
  files: Record<string, string>;
}

export interface ImageData {
  filename: string;
  // 'imageBlob' will be null when filenames
  // are not present in localStorage.
  imageBlob: Blob | null;
}

interface SkillCreationBackendResponse {
  skillId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkillCreationBackendApiService {
  constructor(
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService
  ) {}

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
    successCallback: (value: SkillCreationBackendResponse) => void,
    errorCallback: (reason: string) => void,
    description: string,
    rubrics: RubricBackendDict,
    explanation: string,
    linkedTopicIds: string[],
    files: Record<string, string>
  ): void {
    let postData: SkillCreationBackendDict = {
      description: description,
      linked_topic_ids: linkedTopicIds,
      explanation_dict: explanation,
      rubrics: rubrics,
      files: files,
    };
    let body = new FormData();
    body.append('payload', JSON.stringify(postData));

    this.http
      .post<SkillCreationBackendResponse>(
        '/skill_editor_handler/create_new',
        body
      )
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback({
              skillId: response.skillId,
            });
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse.error.error);
          }
        }
      );
  }

  async createSkillAsync(
    description: string,
    rubrics: RubricBackendDict,
    explanation: string,
    linkedTopicIds: string[],
    imagesData: ImageData[]
  ): Promise<SkillCreationBackendResponse> {
    const files =
      await this.imageLocalStorageService.getFilenameToBase64MappingAsync(
        imagesData
      );
    return new Promise((resolve, reject) => {
      this._createSkill(
        resolve,
        reject,
        description,
        rubrics,
        explanation,
        linkedTopicIds,
        files
      );
    });
  }
}
