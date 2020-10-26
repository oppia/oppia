// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to update suggestion in creator view
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Suggestion, SuggestionBackendDict, SuggestionObjectFactory } from 'domain/suggestion/SuggestionObjectFactory';

export interface SuggestionData {
  action: string,
  commitMessage: string,
  reviewMessage: string
}

export interface UrlDetails {
  targetType: string,
  targetId: number,
  suggestionId: number
}

export interface UpdateSuggestionBackendResponse {
  suggestion: SuggestionBackendDict;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalForCreatorDashboardBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private suggestionObjectFactory: SuggestionObjectFactory) { }

  updateSuggestion(
    urlDetails: UrlDetails, data: SuggestionData): Promise<Suggestion> {
      return new Promise((resolve, reject) => {
        const HANDLE_SUGGESTION_URL_TEMPLATE = (
          '/suggestionactionhandler/<target_type>/<target_id>/<suggestion_id>');
        const url = this.urlInterpolationService.interpolateUrl(
          HANDLE_SUGGESTION_URL_TEMPLATE, {
            target_type: urlDetails.targetType,
            target_id: urlDetails.targetId.toString(),
            suggestion_id: urlDetails.suggestionId.toString()
          }
        );

        this.http.put<UpdateSuggestionBackendResponse>(url, data).toPromise()
          .then(response => {
            resolve(
              this.suggestionObjectFactory
                .createFromBackendDict(response.suggestion));
          }, errorResponse => {
            reject(errorResponse.error.error);
          });
    });
  }
}

angular.module('oppia').factory(
  'SuggestionModalForCreatorDashboardBackendApiService',
  downgradeInjectable(SuggestionModalForCreatorDashboardBackendApiService));
  