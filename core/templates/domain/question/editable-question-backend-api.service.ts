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

export interface EditableQuestionBackendResponse {
  questionId: string;
}
export interface UpdateEditableQuestionBackendResponse {
  questionDict: QuestionBackendDict;
}
export interface fetchQuestionResponse{
  questionObject: Question
}
export interface ImageData {
  filename: string,
  imageBlob: Blob
}
@Injectable({
  providedIn: 'root'
})
export class EditableQuestionBackendApiService {
  constructor(
    private http: HttpClient,
    private questionObjectFactory: QuestionObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  private _createQuestion(
      skillIds: string[],
      skillDifficulties: number[],
      questionObject: Question,
      imagesData: ImageData[],
      successCallback: (value: EditableQuestionBackendResponse) => void,
      errorCallback: (reason?: string) => void)
    : Promise<EditableQuestionBackendResponse> {
    return new Promise((resolve, reject) => {
      let postData = {
        question_dict: questionObject,
        skill_ids: skillIds,
        skill_difficulties: skillDifficulties
      };

      let body = new FormData();
      body.append('payload', JSON.stringify(postData));
      let filenames = imagesData.map(obj => obj.filename);
      let imageBlobs = imagesData.map(obj => obj.imageBlob);
      for (let idx in imageBlobs) {
        body.append(filenames[idx], imageBlobs[idx]);
      }
      this.http.post<EditableQuestionBackendResponse>(
        QuestionDomainConstants.QUESTION_CREATION_URL, body).toPromise()
        .then(response => {
          successCallback(
            {
              questionId: response.questionId
            });
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        });
    });
  }
  private _fetchQuestion(
      questionId: string,
      successCallback: (value: Question) => void,
      errorCallback: (reason?: string) => void): Promise<Question> {
    return new Promise((resolve, reject) => {
      const questionDataUrl = this.urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE, {
          question_id: questionId
        });

      this.http.get<UpdateEditableQuestionBackendResponse>(questionDataUrl)
        .toPromise().then(
          response => {
            successCallback(
              this.questionObjectFactory
                .createFromBackendDict(response.questionDict),
            );
          },
          errorResponse => {
            errorCallback(errorResponse.error.error);
          });
    });
  }
  private _updateQuestion(
      questionId: string,
      questionVersion: string,
      commitMessage: string,
      changeList:string[],
      successCallback: (value: QuestionBackendDict) => void,
      errorCallback: (reason?: string) => void)
      : Promise<QuestionBackendDict> {
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

  private _editQuestionSkillLinks(
      questionId: string,
      skillIdsTaskArray: (string | number)[],
      difficulty: number,
      successCallback: (value: void) => void,
      errorCallback: (reason?: string) => void)
    : Promise<Question> {
    return new Promise((resolve, reject) => {
      var editQuestionSkillLinkUrl = this.urlInterpolationService
        .interpolateUrl(
          QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE, {
            question_id: questionId
          });
      this.http.put(editQuestionSkillLinkUrl, {
        action: 'edit_links',
        difficulty: difficulty,
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

  private _changeDifficulty(
      questionId: string,
      skillId: string,
      newDifficulty: number,
      successCallback: (value: void) => void,
      errorCallback: (reason?: string) => void)
    : Promise<Question> {
    return new Promise((resolve, reject) => {
      var changeDifficultyUrl = this.urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE, {
          question_id: questionId
        });
      var putData = {
        new_difficulty: newDifficulty,
        action: 'update_difficulty',
        skill_id: skillId
      };
      this.http.put(changeDifficultyUrl, putData).toPromise()
        .then(
          response => {
            successCallback();
          },
          errorResponse => {
            errorCallback(errorResponse.error.error);
          });
    });
  }

  createQuestion(
      skillIds: string[],
      skillDifficulties: number[],
      questionDict: Question,
      imagesData: ImageData[])
      : Promise<EditableQuestionBackendResponse> {
    return new Promise((resolve, reject) => {
      this._createQuestion(
        skillIds, skillDifficulties, questionDict, imagesData, resolve, reject);
    });
  }

  fetchQuestion(questionId: string)
  : Promise<Question> {
    return new Promise((resolve, reject) => {
      this._fetchQuestion(questionId, resolve, reject);
    });
  }

  editQuestionSkillLinks(
      questionId: string,
      skillIdsTaskArray: (string | number)[],
      difficulty: number)
      : Promise<void> {
    return new Promise((resolve, reject) => {
      this._editQuestionSkillLinks(
        questionId, skillIdsTaskArray, difficulty, resolve, reject);
    });
  }

  changeDifficulty(
      questionId: string,
      skillId: string,
      newDifficulty: number)
      : Promise<void> {
    return new Promise((resolve, reject) => {
      this._changeDifficulty(
        questionId, skillId, newDifficulty, resolve, reject);
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
  updateQuestion(
      questionId: string,
      questionVersion: string,
      commitMessage: string,
      changeList: string[])
      : Promise<QuestionBackendDict> {
    return new Promise((resolve, reject) => {
      this._updateQuestion(
        questionId, questionVersion,
        commitMessage, changeList, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'EditableQuestionBackendApiService',
  downgradeInjectable(EditableQuestionBackendApiService)
);
