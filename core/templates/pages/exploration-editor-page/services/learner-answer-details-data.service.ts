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

import {ExplorationDataService} from
  './exploration-data.service';
import {UrlInterpolationService} from
  '../../../domain/utilities/url-interpolation.service';
import {LearnerAnswerInfo} from
  '../../../domain/statistics/LearnerAnswerInfoObjectFactory';
import {LearnerAnswerDetails} from
  '../../../domain/statistics/LearnerAnswerDetailsObjectFactory';
import {downgradeInjectable} from
  '@angular/upgrade/static';  
import {Injectable} from
  '@angular/core';
import {HttpClient} from
  '@angular/common/http';

@Injectable( {
  providedIn: 'root'
})
export class LearnerAnswerDetailsDataService {
  
  constructor(
    private explorationDataService:ExplorationDataService,
    private urlInterpolationService: UrlInterpolationService,
    private http:HttpClient,
  ){
    
  }
    _expId;
    _data;
    learnerAnswerInfoData=null;
    LEARNER_ANSWER_INFO_DATA_URL=(
      '/learneranswerinfohandler/learner_answer_details/<entity_type>/' +
      '<entity_id>'
    );

   private _fetchLearnerAnswerInfoData=()=>{
      var learnerAnswerInfoDataUrl=this.urlInterpolationService.interpolateUrl(
        this.LEARNER_ANSWER_INFO_DATA_URL, {
        entity_type : 'exploration',
        entity_id : this._expId
        });
        return this.http.get(learnerAnswerInfoDataUrl);
    }
    private _deleteLearnerAnswerInfo=(entityId, stateName, learnerAnswerInfoId)=>{
      var learnerAnswerInfoDataUrl=this.urlInterpolationService.interpolateUrl(
        this.LEARNER_ANSWER_INFO_DATA_URL,{
          entity_type:'exploration',
          entity_id:entityId
        });
      return this.http.delete(learnerAnswerInfoDataUrl, {
        params: {
          state_name: stateName,
          learner_answer_info_id: learnerAnswerInfoId
        }
      });
    };
    public getData() {
      return this._data;
    }
    public fetchLearnerAnswerInfoData() {
      return this._fetchLearnerAnswerInfoData().toPromise().then(
        (response)=>{
          this.learnerAnswerInfoData = response.body.learner_answer_info_data;
          for (var i = 0;i < this.learnerAnswerInfoData.length;i++) {
            var stateName = this.learnerAnswerInfoData[i].state_name;
            var interactionId = this.learnerAnswerInfoData[i].interaction_id;
            var customizationArgs = 
            this.learnerAnswerInfoData[i].customization_args;
            var learnerAnswerInfoDicts = (
              this.learnerAnswerInfoData[i].learner_answer_info_dicts
            );
            var learnerAnswerDetails = (
              LearnerAnswerDetails.createDefaultLearnerAnswerDetails(
                this._expId,stateName, interactionId,customizationArgs, 
                learnerAnswerInfoDicts.map(
                  LearnerAnswerInfo.createFormBackendDict
                )
              )
            );
            this._data.push(learnerAnswerDetails);
          }
          return response.body;
        }
      );
    }
    public deleteLearnerAnswerInfo(entityId,stateName,learnerAnswerInfoId) {
      return this._deleteLearnerAnswerInfo(
        entityId,stateName,learnerAnswerInfoId
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
