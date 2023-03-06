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

export interface ViewContributionBackendResponse {
  usernames: string[];
}

export interface ContributionRightsBackendResponse {
  'can_review_questions': boolean;
  'can_review_translation_for_language_codes': string[];
  'can_review_voiceover_for_language_codes': string[];
  'can_submit_questions': boolean;
}

export interface TranslationContributionStatsBackendResponse {
  'translation_contribution_stats': TranslationContributionStats[];
}

interface TranslationContributionStats {
  'language': string;
  'topic_name': string;
  'submitted_translations_count': number;
  'submitted_translation_word_count': number;
  'accepted_translations_count': number;
  'accepted_translations_without_reviewer_edits_count': number;
  'accepted_translation_word_count': number;
  'rejected_translations_count': number;
  'rejected_translation_word_count': number;
  'contribution_months': string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContributorDashboardAdminBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService) {}

  async addContributionReviewerAsync(
      category: string, username: string, languageCode: string | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(
        this.urlInterpolationService.interpolateUrl(
          PageConstants.CONTRIBUTION_RIGHTS_HANDLER_URL, { category }), {
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
      category: string, languageCode: string | null
  ): Promise<ViewContributionBackendResponse> {
    let params = {};
    if (languageCode !== null) {
      params = {
        language_code: languageCode
      };
    }
    var url = this.urlInterpolationService.interpolateUrl(
      PageConstants.GET_CONTRIBUTOR_USERS_HANDLER_URL, { category });
    return new Promise((resolve, reject) => {
      this.http.get<ViewContributionBackendResponse>(url, {
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
        PageConstants.CONTRIBUTION_RIGHTS_DATA_HANDLER_URL, {
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
      username: string, category: string, languageCode: string | null
  ): Promise<void> {
    const url = this.urlInterpolationService.interpolateUrl(
      PageConstants.CONTRIBUTION_RIGHTS_HANDLER_URL, { category });
    const params: {
      username: string;
      language_code?: string;
    } = {
      username: username
    };
    if (languageCode !== null) {
      params.language_code = languageCode;
    }
    return new Promise((resolve, reject) => {
      this.http.delete<void>(
        url, { params } as Object
      ).toPromise().then(response => {
        resolve(response);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async viewTranslationContributionStatsAsync(
      username: string): Promise<TranslationContributionStatsBackendResponse> {
    return new Promise((resolve, reject) => {
      this.http.get<TranslationContributionStatsBackendResponse>(
        PageConstants.TRANSLATION_CONTRIBUTION_STATS_HANDLER_URL, {
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
}

angular.module('oppia').factory(
  'ContributorDashboardAdminBackendApiService',
  downgradeInjectable(ContributorDashboardAdminBackendApiService));
