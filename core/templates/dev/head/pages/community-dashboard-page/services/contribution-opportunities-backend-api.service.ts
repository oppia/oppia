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
 * @fileoverview Service for fetching the opportunities available for
 * contributors to contribute.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import Constants from 'assets/constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class ContributionOpportunitiesBackendApiService {
  constructor(private httpClient: HttpClient,
              private urlInterpolationService: UrlInterpolationService) {}

  urlTemplate = '/opportunitiessummaryhandler/<opportunityType>';

  fetchTranslationOpportunities(
      languageCode, cursor, successCallback) {
    return this.httpClient.get(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate,
        {opportunityType: Constants.OPPORTUNITY_TYPE_TRANSLATION}
      ), {
        params: {
          language_code: languageCode,
          cursor: cursor
        }
      }).toPromise().then((response: any) => {
      successCallback(response.data);
    });
  }
  fetchVoiceoverOpportunities(
      languageCode, cursor, successCallback) {
    return this.httpClient.get(
      this.urlInterpolationService.interpolateUrl(
        this.urlTemplate,
        {opportunityType: Constants.OPPORTUNITY_TYPE_VOICEOVER}
      ), {
        params: {
          language_code: languageCode,
          cursor: cursor
        }
      }).toPromise().then((response: any) => {
      successCallback(response.data);
    });
  }
}

angular.module('oppia').factory(
  'ContributionOpportunitiesBackendApiService',
  downgradeInjectable(ContributionOpportunitiesBackendApiService));
