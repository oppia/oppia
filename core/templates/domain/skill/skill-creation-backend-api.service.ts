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
import { HttpClient } from '@angular/common/http';
import { ImageLocalStorageService } from 'services/image-local-storage.service';

export interface RubricBackendDict {
  difficulty: string;
  explanations: string[];
}

export interface SkillCreationBackendDict {
  'description': string;
  'explanation_dict': string;
  'linked_topic_ids': string[];
  'rubrics': RubricBackendDict;
  files?: Record<string, unknown>;
}

export interface ImageData {
  filename: string;
  imageBlob: Blob;
}

interface SkillCreationBackendResponse {
  skillId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillCreationBackendApiService {
  constructor(
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService
  ) {}

  async createSkillAsync(
      description: string, rubrics: RubricBackendDict,
      explanation: string, linkedTopicIds: string[], imagesData: ImageData[]
  ): Promise<SkillCreationBackendResponse> {
    let postData: SkillCreationBackendDict = {
      description: description,
      linked_topic_ids: linkedTopicIds,
      explanation_dict: explanation,
      rubrics: rubrics,
      files: (
        await this.imageLocalStorageService
          .getFilenameToBase64MappingAsync(imagesData))
    };
    let body = new FormData();
    body.append('payload', JSON.stringify(postData));

    return this.http.post<SkillCreationBackendResponse>(
      '/skill_editor_handler/create_new', body
    ).toPromise()
      .then(response => {
        return {
          skillId: response.skillId
        };
      })
      .catch((errorResponse) => {
        return errorResponse.error.error;
      });
  }
}

angular.module('oppia').factory('SkillCreationBackendApiService',
  downgradeInjectable(SkillCreationBackendApiService));
