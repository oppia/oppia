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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse }
  from '@angular/common/http';

import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { LearnerAnswerDetailsObjectFactory }
  from 'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfoObjectFactory }
  from 'domain/statistics/LearnerAnswerInfoObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})

export class LearnerAnswerDetailsDataService {
  private _expId: string = this.explorationDataService.explorationId;
  private _data: Array<any> = [];
  learnerAnswerInfoData: Array<any> = null;
  LEARNER_ANSWER_INFO_DATA_URL = (
    '/learneranswerinfohandler/learner_answer_details/<entity_type>/' +
    '<entity_id>');

  constructor(
    private explorationDataService: ExplorationDataService,
    private http: HttpClient,
    private learnerAnswerDetailsObjectFactory:
      LearnerAnswerDetailsObjectFactory,
    private learnerAnswerInfoObjectFactory: LearnerAnswerInfoObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) { }

  private _fetchLearnerAnswerInfoData() {
    let learnerAnswerInfoDataUrl = this.urlInterpolationService.interpolateUrl(
      this.LEARNER_ANSWER_INFO_DATA_URL, {
        entity_type: 'exploration',
        entity_id: this._expId});

    return this.http.get(learnerAnswerInfoDataUrl);
  }

  private _deleteLearnerAnswerInfo(
      entityId, stateName, learnerAnswerInfoId) {
    let learnerAnswerInfoDataUrl = this.urlInterpolationService.interpolateUrl(
      this.LEARNER_ANSWER_INFO_DATA_URL, {
        entity_type: 'exploration',
        entity_id: entityId});
    return this.http['delete'](learnerAnswerInfoDataUrl, {
      params: {
        state_name: stateName,
        learner_answer_info_id: learnerAnswerInfoId
      }
    });
  }

  getData(): Array<any> {
    return this._data;
  }

  fetchLearnerAnswerInfoData() {
    return this._fetchLearnerAnswerInfoData().then((response) => {
      this.learnerAnswerInfoData =
        response.data.learner_answer_info_data;
      for (let i = 0; i < this.learnerAnswerInfoData.length; i++) {
        let stateName = this.learnerAnswerInfoData[i].state_name;
        let interactionId = this.learnerAnswerInfoData[i].interaction_id;
        let customizationArgs =
          this.learnerAnswerInfoData[i].customization_args;
        let learnerAnswerInfoDicts = (
          this.learnerAnswerInfoData[i].learner_answer_info_dicts);
        let learnerAnswerDetails = (
          // eslint-disable-next-line max-len
          this.learnerAnswerDetailsObjectFactory
            .createDefaultLearnerAnswerDetails(
              this._expId, stateName, interactionId, customizationArgs,
              learnerAnswerInfoDicts.map(
                this.learnerAnswerInfoObjectFactory.createFromBackendDict)));
        this._data.push(learnerAnswerDetails);
      }
      return response.data;
    });
  }

  deleteLearnerAnswerInfo(entityId, stateName, learnerAnswerInfoId) {
    return this._deleteLearnerAnswerInfo(
      entityId, stateName, learnerAnswerInfoId).toPromise()
      .then((response: HttpResponse<any>) => {
        return response.status;
      }, (errorResponse: HttpErrorResponse) => {
        return errorResponse.error;
      });
  }
}

angular.module('oppia').factory(
  'LearnerAnswerDetailsDataService',
  downgradeInjectable(LearnerAnswerDetailsDataService));
