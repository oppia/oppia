// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A backend api service for handling question suggestions.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ImageData} from 'domain/skill/skill-creation-backend-api.service';
import {Question} from 'domain/question/QuestionObjectFactory';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {ImageLocalStorageService} from 'services/image-local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionSuggestionBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService
  ) {}

  async submitSuggestionAsync(
    question: Question,
    associatedSkill: Skill,
    skillDifficulty: number,
    imagesData: ImageData[]
  ): Promise<Object> {
    let url: string = '/suggestionhandler/';
    let postData: Object = {
      suggestion_type: 'add_question',
      target_type: 'skill',
      description: 'Add new question',
      target_id: associatedSkill.getId(),
      target_version_at_submission: associatedSkill.getVersion(),
      change_cmd: {
        cmd: 'create_new_fully_specified_question',
        question_dict: question.toBackendDict(true),
        skill_id: associatedSkill.getId(),
        skill_difficulty: skillDifficulty,
      },
      files:
        await this.imageLocalStorageService.getFilenameToBase64MappingAsync(
          imagesData
        ),
    };

    let body: FormData = new FormData();
    body.append('payload', JSON.stringify(postData));
    return this.httpClient.post<Object>(url, body).toPromise();
  }
}
