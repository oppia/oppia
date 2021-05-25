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
 * @fileoverview Service that manages contributor dashboard admin's backend api
 * calls.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributorDashboardAdminPageConstants as PageConstants } from '../contributor-dashboard-admin-page.constants';

interface ViewContributionBackendResponse {
  usernames: string[];
}

interface ContributionRightsBackendResponse {
  'can_review_questions': boolean,
  'can_review_translation_for_language_codes': string[],
  'can_review_voiceover_for_language_codes': string[],
  'can_submit_questions': boolean
}

@Injectable({
  providedIn: 'root'
})
export class ContributorDashboardAdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async addContributionReviewerAsync(
      category: string, username: string, languageCode: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        PageConstants.ADD_CONTRIBUTION_RIGHTS_HANDLER_URL, {
          category: category,
          username: username,
          language_code: languageCode
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async viewContributionReviewersAsync(
      category: string, languageCode: string
  ): Promise<ViewContributionBackendResponse> {
    let params = {};
    if (languageCode === null) {
      params = { category: category };
    } else {
      params = {
        category: category,
        language_code: languageCode
      };
    }
    return new Promise((resolve, reject) => {
      this.http.get<ViewContributionBackendResponse>(
        PageConstants.GET_CONTRIBUTOR_USERS_HANDLER_URL, {
          params
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async contributionReviewerRightsAsync(
      username: string): Promise<ContributionRightsBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<ContributionRightsBackendResponse>(
        PageConstants.CONTRIBUTION_RIGHTS_HANDLER_URL, {
          params: {
            username: username
          }
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async removeContributionReviewerAsync(
      username: string, method: string,
      category: string, languageCode: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put<void>(
        PageConstants.REMOVE_CONTRIBUTION_RIGHTS_HANDLER_URL, {
          username: username,
          removal_type: method,
          category: category,
          language_code: languageCode
        }
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'ContributorDashboardAdminBackendApiService',
  downgradeInjectable(ContributorDashboardAdminBackendApiService));
