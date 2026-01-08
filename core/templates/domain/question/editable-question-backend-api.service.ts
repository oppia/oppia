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
 * @fileoverview Service to send and receive changes to a question in the backend
 */

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {QuestionBackendDict, Question} from 'domain/question/question.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import {SkillBackendDict} from 'domain/skill/skill.model';
import {BackendChangeObject} from 'domain/editor/undo_redo/change.model';

import cloneDeep from 'lodash/cloneDeep';

export interface CreateQuestionResponse {
  questionId: string;
}

export interface CreateQuestionResponseBackendDict {
  question_id: string;
}

export interface SkillLinkageModificationsArray {
  id: string;
  task: string;
  difficulty: number;
}

export interface FetchQuestionBackendResponse {
  associated_skill_dicts?: SkillBackendDict[] | {};
  is_super_admin: boolean;
  question_dict: QuestionBackendDict;
  user_email: string;
  username: string;
}

export interface UpdateEditableQuestionBackendResponse {
  question_dict: QuestionBackendDict;
}

export interface FetchQuestionResponse {
  questionObject: Question;
  associated_skill_dicts: SkillBackendDict[];
}

export interface ImageData {
  filename: string;
  imageBlob: Blob;
}

@Injectable({
  providedIn: 'root',
})
export class EditableQuestionBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchQuestionAsync(
    questionId: string,
    successCallback: (value: FetchQuestionResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    const url = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
      {question_id: questionId}
    );

    this.http.get<FetchQuestionBackendResponse>(url).subscribe(
      response => {
        if (!('associated_skill_dicts' in response)) {
          errorCallback('Unknown backend error');
          return;
        }

        const questionObject = Question.createFromBackendDict(
          response.question_dict
        );

        const associatedSkillDicts = Array.isArray(
          response.associated_skill_dicts
        )
          ? response.associated_skill_dicts
          : [];

        successCallback({
          questionObject,
          associated_skill_dicts: cloneDeep(associatedSkillDicts),
        });
      },
      () => {
        errorCallback('Unknown backend error');
      }
    );
  }

  private _updateQuestionAsync(
    questionId: string,
    questionVersion: string,
    commitMessage: string,
    changeList: BackendChangeObject[],
    successCallback: (value: QuestionBackendDict) => void,
    errorCallback: (reason: string) => void
  ): void {
    const url = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
      {question_id: questionId}
    );

    this.http
      .put<UpdateEditableQuestionBackendResponse>(url, {
        version: questionVersion,
        commit_message: commitMessage,
        change_list: changeList,
      })
      .subscribe(
        response => {
          successCallback(cloneDeep(response.question_dict));
        },
        () => {
          errorCallback('Unknown backend error');
        }
      );
  }

  private _editQuestionSkillLinksAsync(
    questionId: string,
    skillIdsTaskArray: SkillLinkageModificationsArray[],
    successCallback: () => void,
    errorCallback: (reason: string) => void
  ): void {
    const url = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE,
      {question_id: questionId}
    );

    this.http.put(url, {skill_ids_task_list: skillIdsTaskArray}).subscribe(
      () => successCallback(),
      () => errorCallback('Unknown backend error')
    );
  }

  private _createQuestionAsync(
    skillIds: string[],
    skillDifficulties: number[],
    questionDict: QuestionBackendDict,
    imagesData: ImageData[],
    successCallback: (value: CreateQuestionResponse) => void,
    errorCallback: (reason: string) => void
  ): void {
    const body = new FormData();

    body.append(
      'payload',
      JSON.stringify({
        question_dict: questionDict,
        skill_ids: skillIds,
        skill_difficulties: skillDifficulties,
        filenames: JSON.stringify(imagesData.map(i => i.filename)),
      })
    );

    imagesData.forEach((img, i) => {
      body.append(`image${i}`, img.imageBlob);
    });

    this.http
      .post<CreateQuestionResponseBackendDict>(
        QuestionDomainConstants.QUESTION_CREATION_URL,
        body
      )
      .subscribe(
        response => {
          successCallback({questionId: response.question_id});
        },
        () => {
          errorCallback('Unknown backend error');
        }
      );
  }

  fetchQuestionAsync(questionId: string): Promise<FetchQuestionResponse> {
    return new Promise((resolve, reject) => {
      this._fetchQuestionAsync(questionId, resolve, reject);
    });
  }

  updateQuestionAsync(
    questionId: string,
    questionVersion: string,
    commitMessage: string,
    changeList: BackendChangeObject[]
  ): Promise<QuestionBackendDict> {
    return new Promise((resolve, reject) => {
      this._updateQuestionAsync(
        questionId,
        questionVersion,
        commitMessage,
        changeList,
        resolve,
        reject
      );
    });
  }

  editQuestionSkillLinksAsync(
    questionId: string,
    skillIdsTaskArray: SkillLinkageModificationsArray[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this._editQuestionSkillLinksAsync(
        questionId,
        skillIdsTaskArray,
        resolve,
        reject
      );
    });
  }

  createQuestionAsync(
    skillIds: string[],
    skillDifficulties: number[],
    questionDict: QuestionBackendDict,
    imagesData: ImageData[]
  ): Promise<CreateQuestionResponse> {
    return new Promise((resolve, reject) => {
      this._createQuestionAsync(
        skillIds,
        skillDifficulties,
        questionDict,
        imagesData,
        resolve,
        reject
      );
    });
  }
}
