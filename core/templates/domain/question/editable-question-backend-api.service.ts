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
  associated_skill_dicts?: SkillBackendDict[] | unknown;
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

  private async _createQuestionAsync(
    skillIds: string[],
    skillDifficulties: number[],
    questionObject: QuestionBackendDict,
    imagesData: ImageData[],
    successCallback: (value: CreateQuestionResponse) => void,
    errorCallback: (reason: string) => void
  ): Promise<void> {
    const body = new FormData();
    const filenames = imagesData.map(obj => obj.filename);
    const imageBlobs = imagesData.map(obj => obj.imageBlob);

    const postData = {
      question_dict: questionObject,
      skill_ids: skillIds,
      skill_difficulties: skillDifficulties,
      filenames: JSON.stringify(filenames),
    };

    body.append('payload', JSON.stringify(postData));
    imageBlobs.forEach((blob, idx) => {
      body.append(`image${idx}`, blob);
    });

    try {
      const response = await this.http
        .post<CreateQuestionResponseBackendDict>(
          QuestionDomainConstants.QUESTION_CREATION_URL,
          body
        )
        .toPromise();

      successCallback({questionId: response.question_id});
    } catch {
      errorCallback('Unknown backend error');
    }
  }

  private async _fetchQuestionAsync(
    questionId: string,
    successCallback: (value: FetchQuestionResponse) => void,
    errorCallback: (reason: string) => void
  ): Promise<void> {
    const questionDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
      {question_id: questionId}
    );

    try {
      const response = await this.http
        .get<FetchQuestionBackendResponse>(questionDataUrl)
        .toPromise();

      if (!Array.isArray(response.associated_skill_dicts)) {
        throw new Error();
      }

      const questionObject = Question.createFromBackendDict(
        response.question_dict
      );

      successCallback({
        questionObject,
        associated_skill_dicts: cloneDeep(response.associated_skill_dicts),
      });
    } catch {
      errorCallback('Unknown backend error');
    }
  }

  private async _updateQuestionAsync(
    questionId: string,
    questionVersion: string,
    commitMessage: string,
    changeList: BackendChangeObject[],
    successCallback: (value: QuestionBackendDict) => void,
    errorCallback: (reason: string) => void
  ): Promise<void> {
    const editableQuestionDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
      {question_id: questionId}
    );

    const putData = {
      version: questionVersion,
      commit_message: commitMessage,
      change_list: changeList,
    };

    try {
      const response = await this.http
        .put<UpdateEditableQuestionBackendResponse>(
          editableQuestionDataUrl,
          putData
        )
        .toPromise();

      successCallback(cloneDeep(response.question_dict));
    } catch {
      errorCallback('Unknown backend error');
    }
  }

  private async _editQuestionSkillLinksAsync(
    questionId: string,
    skillIdsTaskArray: SkillLinkageModificationsArray[],
    successCallback: () => void,
    errorCallback: (reason: string) => void
  ): Promise<void> {
    const editQuestionSkillLinkUrl =
      this.urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE,
        {question_id: questionId}
      );

    try {
      await this.http
        .put(editQuestionSkillLinkUrl, {
          skill_ids_task_list: skillIdsTaskArray,
        })
        .toPromise();

      successCallback();
    } catch {
      errorCallback('Unknown backend error');
    }
  }

  async createQuestionAsync(
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

  async fetchQuestionAsync(questionId: string): Promise<FetchQuestionResponse> {
    return new Promise((resolve, reject) => {
      this._fetchQuestionAsync(questionId, resolve, reject);
    });
  }

  async editQuestionSkillLinksAsync(
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

  async updateQuestionAsync(
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
}
