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

import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StatisticsDomainConstants } from 'domain/statistics/statistics-domain.constants';

@Injectable({
    providedIn: 'root'
})
export class LearnerAnswerDetailsBackendApiService {
    constructor(
        private http: HttpClient,
        private urlInterpolationService: UrlInterpolationService
    ) { }

    private _recordLearnerAnswerDetails(expId: string, stateName: string, interactionId: string, answer: string, answerDetails: string,
        successCallback: any, errorCallback: any) {

        var recordLearnerAnswerDetailsUrl = this.urlInterpolationService.interpolateUrl(
            StatisticsDomainConstants.SUBMIT_LEARNER_ANSWER_DETAILS_URL, {
            entity_type: 'exploration',
            entity_id: expId
        });

        var payload = {
            state_name: stateName,
            interaction_id: interactionId,
            answer: answer,
            answer_details: answerDetails
        };

        this.http.put(recordLearnerAnswerDetailsUrl, payload)
            .toPromise().then(
                () => successCallback && successCallback(),
                errorResponse => errorCallback && errorCallback(errorResponse.body)
            );
    }

    recordLearnerAnswerDetails(expId: string, stateName: string, interactionId: string, answer: string, answerDetails: string): Promise<object> {
        return new Promise((resolve, reject) => {
            this._recordLearnerAnswerDetails(expId, stateName, interactionId,
                answer, answerDetails, resolve, reject)
        })
    }
}

angular.module('oppia').factory('LearnerAnswerDetailsBackendApiService', downgradeInjectable(LearnerAnswerDetailsBackendApiService));