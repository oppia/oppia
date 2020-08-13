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
 * @fileoverview Service to get learner answer info data and to delete
 * any learner answer info.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { LearnerAnswerDetails } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfo } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { LearnerAnswerDetailsBackendApiService } from 
  'domain/statistics/learner-answer-details-backend-api.service';
@Injectable( {
  providedIn: 'root'
})
export class LearnerAnswerDetailsDataService {
  constructor(
    private explorationDataService:ExplorationDataService,
    private http:HttpClient,
    private learnerAnswerDetailsBackendApiService:LearnerAnswerDetailsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}
  _expId: string;
  _data;
  learnerAnswerInfoData=null;
  LEARNER_ANSWER_INFO_DATA_URL = (
    '/learneranswerinfohandler/learner_answer_details/<entity_type>/' +
    '<entity_id>'
  );
  public getData() {
    return this._data;
  }
  public fetchLearnerAnswerInfoData() {
    return this.learnerAnswerDetailsBackendApiService._fetchLearnerAnswerInfoData().then(
      (response)=>{
        this.learnerAnswerInfoData = response.learner_answer_info_data;
        for (let i = 0;i < this.learnerAnswerInfoData.length;i++) {
          const stateName = this.learnerAnswerInfoData[i].state_name;
          const interactionId = this.learnerAnswerInfoData[i].interaction_id;
          const customizationArgs =
          this.learnerAnswerInfoData[i].customization_args;
          const learnerAnswerInfoDicts = (
            this.learnerAnswerInfoData[i].learner_answer_info_dicts
          );
          const learnerAnswerDetails = (
            LearnerAnswerDetails.createDefaultLearnerAnswerDetails(
              this._expId, stateName, interactionId, customizationArgs,
              learnerAnswerInfoDicts.map(
                LearnerAnswerInfo.createFormBackendDict
              )
            )
          );
          this._data.push(learnerAnswerDetails);
        }
        return response;
      }
    );
  }
  public deleteLearnerAnswerInfo(entityId, stateName, learnerAnswerInfoId) {
    return this.learnerAnswerDetailsBackendApiService._deleteLearnerAnswerInfo(
      entityId, stateName, learnerAnswerInfoId
    ).toPromise().then((response)=>{
      return response.status;
    },
    (errorResponse)=>{
      return Promise.reject(errorResponse.body);
    });
  }
}
angular.module('oppia').factory('LearnerAnswerDetailsDataService',
  downgradeInjectable(LearnerAnswerDetailsDataService));
