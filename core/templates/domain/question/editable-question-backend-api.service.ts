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
 * @fileoverview Service to send and receive changes to a question in the
 *  backend.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { HttpClient } from '@angular/common/http';
import { QuestionObjectFactory, QuestionBackendDict, Question } from 'domain/question/QuestionObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { QuestionDomainConstants } from 'domain/question/question-domain.constants';
import { SkillBackendDict } from 'domain/skill/SkillObjectFactory';
import { BackendChangeObject } from 'domain/editor/undo_redo/change.model';

export interface CreateQuestionResponse {
  questionId: string;
}

export interface CreateQuestionResponseBackendDict {
  'question_id': string;
}

export interface SkillLinkageModificationsArray {
  id: string;
  task: string;
  difficulty: number;
}

export interface FetchQuestionBackendResponse {
  'associated_skill_dicts': SkillBackendDict[];
  'is_super_admin': boolean;
  'question_dict': QuestionBackendDict;
  'user_email': string;
  username: string;
}
export interface UpdateEditableQuestionBackendResponse {
  questionDict: QuestionBackendDict;
}
export interface FetchQuestionResponse{
  questionObject: Question;
  'associated_skill_dicts': SkillBackendDict[];
}
export interface ImageData {
  filename: string;
  imageBlob: Blob;
}
@Injectable({
  providedIn: 'root'
})
export class EditableQuestionBackendApiService {
  constructor(
    private http: HttpClient,
    private questionObjectFactory: QuestionObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  private async _createQuestionAsync(
      skillIds: string[],
      skillDifficulties: number[],
      questionObject: QuestionBackendDict,
      imagesData: ImageData[],
      successCallback: (value: CreateQuestionResponse) => void,
      errorCallback: (reason?: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let body = new FormData();
      let filenames = imagesData.map(obj => obj.filename);
      let imageBlobs = imagesData.map(obj => obj.imageBlob);
      let postData = {
        question_dict: questionObject,
        skill_ids: skillIds,
        skill_difficulties: skillDifficulties,
        filenames: JSON.stringify(filenames)
      };
      body.append('payload', JSON.stringify(postData));
      for (let idx in imageBlobs) {
        body.append(`image${idx}`, imageBlobs[idx]);
      }
      this.http.post<CreateQuestionResponseBackendDict>(
        QuestionDomainConstants.QUESTION_CREATION_URL, body).toPromise()
        .then(response => {
          successCallback(
            {
              questionId: response.question_id
            });
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        });
    });
  }

  private async _fetchQuestionAsync(
      questionId: string,
      successCallback: (value: FetchQuestionResponse) => void,
      errorCallback: (reason?: string) => void):
        Promise<FetchQuestionBackendResponse> {
    return new Promise((resolve, reject) => {
      const questionDataUrl = this.urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      this.http.get<FetchQuestionBackendResponse>(questionDataUrl)
        .toPromise().then(
          response => {
            let questionObject = (
              this.questionObjectFactory.createFromBackendDict(
                response.question_dict));
            let skillDicts = angular.copy(
              response.associated_skill_dicts);
            successCallback({
              questionObject: questionObject,
              associated_skill_dicts: skillDicts
            });
          },
          errorResponse => {
            errorCallback(errorResponse.error.error);
          });
    });
  }

  private async _updateQuestionAsync(
      questionId: string,
      questionVersion: string,
      commitMessage: string,
      changeList: BackendChangeObject[],
      successCallback: (value: QuestionBackendDict) => void,
      errorCallback: (reason?: string) => void): Promise<QuestionBackendDict> {
    return new Promise((resolve, reject) => {
      let editableQuestionDataUrl = this.urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      let putData = {
        version: questionVersion,
        commit_message: commitMessage,
        change_list: changeList
      };
      this.http.put<UpdateEditableQuestionBackendResponse>(
        editableQuestionDataUrl, putData).toPromise()
        .then(response => {
          let questionDict = angular.copy(response.questionDict);
          successCallback(
            // The returned data is an updated question dict.
            questionDict);
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        });
    });
  }

  private async _editQuestionSkillLinksAsync(
      questionId: string,
      skillIdsTaskArray: SkillLinkageModificationsArray[],
      successCallback: (value: void) => void,
      errorCallback: (reason?: string) => void): Promise<Question> {
    return new Promise((resolve, reject) => {
      var editQuestionSkillLinkUrl = this.urlInterpolationService
        .interpolateUrl(
          QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE, {
            question_id: questionId
          });
      this.http.put(editQuestionSkillLinkUrl, {
        skill_ids_task_list: skillIdsTaskArray
      }).toPromise()
        .then(
          response => {
            successCallback();
          },
          errorResponse => {
            errorCallback(errorResponse.error.error);
          });
    });
  }

  async createQuestionAsync(
      skillIds: string[],
      skillDifficulties: number[],
      questionDict: QuestionBackendDict,
      imagesData: ImageData[]): Promise<CreateQuestionResponse> {
    return new Promise((resolve, reject) => {
      this._createQuestionAsync(
        skillIds, skillDifficulties, questionDict, imagesData, resolve, reject);
    });
  }

  async fetchQuestionAsync(questionId: string): Promise<FetchQuestionResponse> {
    return new Promise((resolve, reject) => {
      this._fetchQuestionAsync(questionId, resolve, reject);
    });
  }

  async editQuestionSkillLinksAsync(
      questionId: string,
      skillIdsTaskArray: SkillLinkageModificationsArray[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this._editQuestionSkillLinksAsync(
        questionId, skillIdsTaskArray, resolve, reject);
    });
  }

  /**
  * Updates a question in the backend with the provided question ID.
  * The changes only apply to the question of the given version and the
  * request to update the question will fail if the provided question
  * version is older than the current version stored in the backend. Both
  * the changes and the message to associate with those changes are used
  * to commit a change to the question. The new question is passed to
  * the success callback, if one is provided to the returned promise
  * object. Errors are passed to the error callback, if one is provided.
  */
  async updateQuestionAsync(
      questionId: string,
      questionVersion: string,
      commitMessage: string,
      changeList: BackendChangeObject[]): Promise<QuestionBackendDict> {
    return new Promise((resolve, reject) => {
      this._updateQuestionAsync(
        questionId, questionVersion,
        commitMessage, changeList, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'EditableQuestionBackendApiService',
  downgradeInjectable(EditableQuestionBackendApiService)
);
