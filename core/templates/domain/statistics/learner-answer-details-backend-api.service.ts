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
 * @fileoverview Service to record learner answer info.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';

@Injectable({
  providedIn: 'root'
})
export class LearnerAnswerDetailsBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}
  
  LEARNER_ANSWER_INFO_DATA_URL = (
    '/learneranswerinfohandler/learner_answer_details/<entity_type>/' +
    '<entity_id>'
  );
  _expId: string;
  _fetchLearnerAnswerInfoData() {
    const learnerAnswerInfoDataUrl =
      this.urlInterpolationService.interpolateUrl(
        this.LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: this._expId
        });
    return this.httpClient.get(learnerAnswerInfoDataUrl).toPromise();
  }
  _deleteLearnerAnswerInfo(
      entityId, stateName, learnerAnswerInfoId) {
    const learnerAnswerInfoDataUrl =
      this.urlInterpolationService.interpolateUrl(
        this.LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: entityId
        });
    return this.httpClient['delete'](learnerAnswerInfoDataUrl, {
      params: {
        state_name: stateName,
        learner_answer_info_id: learnerAnswerInfoId
      }
    });
  }
  recordLearnerAnswerDetails(
      explorationId: string, stateName: string, interactionId: string,
      answer: string, answerDetails: string): Promise<void> {
    let recordLearnerAnswerDetailsUrl = (
      this.urlInterpolationService.interpolateUrl(
        StatisticsDomainConstants.SUBMIT_LEARNER_ANSWER_DETAILS_URL, {
          entity_type: 'exploration',
          entity_id: explorationId
        }));

    let payload = {
      state_name: stateName,
      interaction_id: interactionId,
      answer: answer,
      answer_details: answerDetails
    };

    return this.httpClient.put<void>(
      recordLearnerAnswerDetailsUrl, payload).toPromise().then(() => {},
      errorResponse => {
        throw new Error(errorResponse.error.error);
      });
  }
}

angular.module('oppia').factory(
  'LearnerAnswerDetailsBackendApiService',
  downgradeInjectable(LearnerAnswerDetailsBackendApiService));
