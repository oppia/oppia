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
import { QuestionBackendDict } from
  'domain/question/QuestionObjectFactory';
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';

import constants from 'assets/constants';

interface PretestQuestionsBackendResponse {
  'pretest_question_dicts': QuestionBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class PretestQuestionBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  _fetchPretestQuestions(
      explorationId: string, storyUrlFragment: string,
      successCallback: (value: QuestionBackendDict[]) => void,
      errorCallback: (reason: string) => void): void {
    if (
      !storyUrlFragment ||
      !storyUrlFragment.match(constants.VALID_URL_FRAGMENT_REGEX)) {
      successCallback([]);
      return;
    }

    var pretestDataUrl = this.urlInterpolationService.interpolateUrl(
      QuestionDomainConstants.PRETEST_QUESTIONS_URL_TEMPLATE, {
        exploration_id: explorationId,
        story_url_fragment: storyUrlFragment,
      });

    this.http.get<PretestQuestionsBackendResponse>(
      pretestDataUrl
    ).toPromise().then(data => {
      var pretestQuestionDicts = (
        cloneDeep(data.pretest_question_dicts));
      if (successCallback) {
        successCallback(pretestQuestionDicts);
      }
    }, errorResponse => {
      if (errorCallback) {
        errorCallback(errorResponse.error.error);
      }
    });
  }

  async fetchPretestQuestionsAsync(
      explorationId: string,
      storyUrlFragment: string): Promise<QuestionBackendDict[]> {
    return new Promise((resolve, reject) => {
      this._fetchPretestQuestions(
        explorationId, storyUrlFragment, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'PretestQuestionBackendApiService',
  downgradeInjectable(PretestQuestionBackendApiService));
