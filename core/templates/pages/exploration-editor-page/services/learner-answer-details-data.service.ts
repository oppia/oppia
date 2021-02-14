// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get learner answer info data and to delete
 * any learner answer info.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { LearnerAnswerDetails } from 'domain/statistics/learner-answer-details.model';
import { LearnerAnswerInfo } from 'domain/statistics/learner-answer-info.model';
import { ExplorationDataService } from './exploration-data.service';
import { LearnerAnswerDetailsDataBackendApiService } from
  './learner-answer-details-data-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { InteractionCustomizationArgs } from
  'interactions/customization-args-defs';
export interface ILearnerAnswerDetails{
  'exp_Id': string;
  'state_name': string;
  'interaction_id': string;
  'customization_args': InteractionCustomizationArgs;
  'learner_answer_info_data': LearnerAnswerInfo[];
}
@Injectable({
  providedIn: 'root'
})

export class LearnerAnswerDetailsDataService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private explorationDataService: ExplorationDataService,
    private laddbas :
      LearnerAnswerDetailsDataBackendApiService
  ) { }

  _expId = this.explorationDataService.explorationId;
  _data = [];
  learnerAnswerInfoData = null;

  getData() : LearnerAnswerDetails[] {
    return this._data;
  }

  fetchLearnerAnswerInfoData() :Promise<ILearnerAnswerDetails> {
    return this.laddbas._fetchLearnerAnswerInfoData().then((response) => {
      this.learnerAnswerInfoData = response.body.learner_answer_info_data;
      for (let i = 0; i < this.learnerAnswerInfoData.length; i++) {
        let stateName = this.learnerAnswerInfoData[i].state_name;
        let interactionId = this.learnerAnswerInfoData[i].interaction_id;
        let customizationArgs = this.learnerAnswerInfoData[i]
          .customization_args;
        let learnerAnswerInfoDicts = (
          this.learnerAnswerInfoData[i].learner_answer_info_dicts
        );
        let learnerAnswerDetails = (
          // eslint-disable-next-line max-len
          LearnerAnswerDetails.createDefaultLearnerAnswerDetails(
            this._expId, stateName, interactionId, customizationArgs,
            learnerAnswerInfoDicts.map(
              LearnerAnswerInfo.createFromBackendDict)));
        this._data.push(learnerAnswerDetails);
      }
      return response.body;
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  deleteLearnerAnswerInfo(
      entityId : string, stateName : string, learnerAnswerInfoId : string) {
    return this.laddbas._deleteLearnerAnswerInfo(
      entityId, stateName, learnerAnswerInfoId)
      .then((response) => {
        return response.status;
      }, (errorResponse) => {
        return Promise.reject(errorResponse.body);
      });
  }
}

angular.module('oppia').factory(
  'LearnerAnswerDetailsDataService',
  downgradeInjectable(LearnerAnswerDetailsDataService));
