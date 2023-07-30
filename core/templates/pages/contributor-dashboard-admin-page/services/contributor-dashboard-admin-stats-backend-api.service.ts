// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching contributor admin dashboard stats.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributorAdminDashboardFilter } from '../contributor-admin-dashboard-filter.model';
import { TranslationSubmitterStats, TranslationReviewerStats,
  QuestionSubmitterStats, QuestionReviewerStats
} from '../contributor-dashboard-admin-summary.model';
import { AppConstants } from 'app.constants';
import { ContributorDashboardAdminPageConstants as PageConstants } from '../contributor-dashboard-admin-page.constants';

export interface TranslationSubmitterBackendDict {
    'language_code': string;
    'contributor_name': string;
    'topic_names': string[];
    'recent_performance': number;
    'overall_accuracy': number;
    'submitted_translations_count': number;
    'submitted_translation_word_count': number;
    'accepted_translations_count': number;
    'accepted_translations_without_reviewer_edits_count': number;
    'accepted_translation_word_count': number;
    'rejected_translations_count': number;
    'rejected_translation_word_count': number;
    'first_contribution_date': string;
    'last_contributed_in_days': number;
}

export interface TranslationReviewerBackendDict {
    'language_code': string;
    'contributor_name': string;
    'topic_names': string[];
    'reviewed_translations_count': number;
    'accepted_translations_count': number;
    'accepted_translations_with_reviewer_edits_count': number;
    'accepted_translation_word_count': number;
    'rejected_translations_count': number;
    'first_contribution_date': string;
    'last_contributed_in_days': number;
}

export interface QuestionSubmitterBackendDict {
    'contributor_name': string;
    'topic_names': string[];
    'recent_performance': number;
    'overall_accuracy': number;
    'submitted_questions_count': number;
    'accepted_questions_count': number;
    'accepted_questions_without_reviewer_edits_count': number;
    'rejected_questions_count': number;
    'first_contribution_date': string;
    'last_contributed_in_days': number;
}

export interface QuestionReviewerBackendDict {
    'contributor_name': string;
    'topic_names': string[];
    'reviewed_questions_count': number;
    'accepted_questions_count': number;
    'accepted_questions_with_reviewer_edits_count': number;
    'rejected_questions_count': number;
    'first_contribution_date': string;
    'last_contributed_in_days': number;
}

export interface CommunityContributionStatsBackendDict {
  'translation_reviewers_count': translation_reviewers_count;
  'question_reviewers_count': number;
}

export interface translation_reviewers_count {
  [key: string]: number;
}

export interface CommunityContributionStatsDict {
  'translation_reviewers_count': number;
  'question_reviewers_count': number;
}

export interface TranslationSubmitterStatsData {
  stats: TranslationSubmitterStats[];
  nextOffset: number;
  more: boolean;
}

export interface TranslationSubmitterStatsBackendDict {
  stats: TranslationSubmitterBackendDict[];
  next_offset: number;
  more: boolean;
}

export interface TranslationReviewerStatsData {
  stats: TranslationReviewerStats[];
  nextOffset: number;
  more: boolean;
}

export interface TranslationReviewerStatsBackendDict {
  stats: TranslationReviewerBackendDict[];
  next_offset: number;
  more: boolean;
}

export interface QuestionSubmitterStatsData {
  stats: QuestionSubmitterStats[];
  nextOffset: number;
  more: boolean;
}

export interface QuestionSubmitterStatsBackendDict {
  stats: QuestionSubmitterBackendDict[];
  next_offset: number;
  more: boolean;
}

export interface QuestionReviewerStatsData {
  stats: QuestionReviewerStats[];
  nextOffset: number;
  more: boolean;
}

export interface QuestionReviewerStatsBackendDict {
  stats: QuestionReviewerBackendDict[];
  next_offset: number;
  more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContributorDashboardAdminStatsBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchCommunityStats():
    Promise<CommunityContributionStatsDict> {
    return new Promise((resolve, reject) => {
      this.http.get<CommunityContributionStatsBackendDict>(
        PageConstants.COMMUNITY_CONTRIBUTION_STATS_URL
      ).toPromise().then(response => {
        resolve({
          translation_reviewers_count: (
            response.translation_reviewers_count.en),
          question_reviewers_count: response.question_reviewers_count
        });
      });
    });
  }

  async fetchContributorAdminStats(
      filter: ContributorAdminDashboardFilter,
      pageSize: number,
      nextOffset: number | null,
      contributionType: string,
      contributionSubtype: string
  ):
    Promise<TranslationSubmitterStatsData |
      TranslationReviewerStatsData |
      QuestionSubmitterStatsData |
      QuestionReviewerStatsData> {
    const url = this.urlInterpolationService.interpolateUrl(
      PageConstants.CONTRIBUTOR_ADMIN_STATS_SUMMARIES_URL, {
        contribution_type: contributionType,
        contribution_subtype: contributionSubtype
      }
    );
    if (contributionType === AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION) {
      if (
        contributionSubtype === (
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION)) {
        return new Promise((resolve, reject) => {
          this.http.get<TranslationSubmitterStatsBackendDict>(
            url, {
              params: {
                page_size: pageSize,
                offset: nextOffset,
                language_code: filter.languageCode,
                topic_ids: []
              }
            } as Object
          ).toPromise().then(response => {
            resolve({
              stats: response.stats.map(
                backendDict => TranslationSubmitterStats
                  .createFromBackendDict(backendDict)),
              nextOffset: response.next_offset,
              more: response.more
            });
          }, errorResponse => {
            reject(errorResponse.error.error);
          });
        });
      } else if (
        contributionSubtype === (
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW)
      ) {
        return new Promise((resolve, reject) => {
          this.http.get<TranslationReviewerStatsBackendDict>(
            url, {
              params: {
                page_size: pageSize,
                offset: nextOffset,
                language_code: filter.languageCode,
                topic_ids: []
              }
            } as Object
          ).toPromise().then(response => {
            resolve({
              stats: response.stats.map(
                backendDict => TranslationReviewerStats
                  .createFromBackendDict(backendDict)),
              nextOffset: response.next_offset,
              more: response.more
            });
          }, errorResponse => {
            reject(errorResponse.error.error);
          });
        });
      }
    } else if (
      contributionType === AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION) {
      if (
        contributionSubtype === (
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION)) {
        return new Promise((resolve, reject) => {
          this.http.get<QuestionSubmitterStatsBackendDict>(
            url, {
              params: {
                page_size: pageSize,
                offset: nextOffset,
                language_code: filter.languageCode,
                topic_ids: []
              }
            } as Object
          ).toPromise().then(response => {
            resolve({
              stats: response.stats.map(
                backendDict => QuestionSubmitterStats
                  .createFromBackendDict(backendDict)),
              nextOffset: response.next_offset,
              more: response.more
            });
          }, errorResponse => {
            reject(errorResponse.error.error);
          });
        });
      } else if (
        contributionSubtype === (
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW)
      ) {
        return new Promise((resolve, reject) => {
          this.http.get<QuestionReviewerStatsBackendDict>(
            url, {
              params: {
                page_size: pageSize,
                offset: nextOffset,
                language_code: filter.languageCode,
                topic_ids: []
              }
            } as Object
          ).toPromise().then(response => {
            resolve({
              stats: response.stats.map(
                backendDict => QuestionReviewerStats
                  .createFromBackendDict(backendDict)),
              nextOffset: response.next_offset,
              more: response.more
            });
          }, errorResponse => {
            reject(errorResponse.error.error);
          });
        });
      }
    }
    return Promise.resolve({
      stats: [],
      nextOffset: 0,
      more: false
    });
  }
}

angular.module('oppia').factory(
  'ContributorDashboardAdminStatsBackendApiService',
  downgradeInjectable(ContributorDashboardAdminStatsBackendApiService));
