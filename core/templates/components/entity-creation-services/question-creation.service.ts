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
 * @fileoverview Service to create the question.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class QuestionCreationService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  QUESTION_CREATOR_URL = '/question_editor_handler/create_new';

  private _createNew(
      backendQuestionDict,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    var postData = {
      question_dict: backendQuestionDict
    };
    this.http.post(this.QUESTION_CREATOR_URL, postData).toPromise().then(
      (response) => {
        if (successCallback) {
          successCallback();
        }
      }, (errorResponse) => {
        if (errorCallback) {
          errorCallback(errorResponse);
        }
      });
  }

  createNew(backendQuestionDict): Promise<object> {
    return new Promise((resolve, reject) => {
      this._createNew(backendQuestionDict, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'QuestionCreationService',
  downgradeInjectable(QuestionCreationService));
