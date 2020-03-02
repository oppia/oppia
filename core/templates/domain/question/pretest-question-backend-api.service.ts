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
 * @fileoverview Service to receive questions as pretests for an exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';

@Injectable({
  providedIn: 'root'
})
export class PretestQuestionBackendApiService {
  _cursor: string = '';

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  _fetchPretestQuestions(explorationId: string, storyId: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    if (!storyId || !storyId.match(/^[a-zA-Z0-9]+$/i)) {
      successCallback([]);
      return;
    }

    var pretestDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.PRETEST_QUESTIONS_URL_TEMPLATE, {
        exploration_id: explorationId,
        story_id: storyId,
        cursor: this._cursor
      });

    this.http.get(pretestDataUrl).toPromise().then((data: any) => {
      var pretestQuestionDicts = (
        cloneDeep(data.pretest_question_dicts));
      this._cursor = data.next_start_cursor;
      if (successCallback) {
        successCallback(pretestQuestionDicts);
      }
    }, (error) => {
      if (errorCallback) {
        errorCallback(error);
      }
    });
  }

  fetchPretestQuestions(explorationId: string,
      storyId: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchPretestQuestions(explorationId, storyId, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'PretestQuestionBackendApiService',
  downgradeInjectable(PretestQuestionBackendApiService));
