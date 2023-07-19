// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching and resolving contribution
 * and review stats.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContributorAdminDashboardFilter } from '../contributor-admin-dashboard-filter.model'
import { ContributorAdminStats } from '../contributor-dashboard-admin-summary.model'

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

export interface ContributorAdminStatsData {
  stats: ContributorAdminStats;
  nextOffset: number;
  more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContributorDashboardAdminStatsService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private CONTRIBUTOR_ADMIN_STATS_SUMMARIES_URL = (
    '/contributor-dashboard-admin-stats/<contribution_type>/' +
    '<contribution_subtype>');

  async fetchContributorAdminStats(
    filter: ContributorAdminDashboardFilter,
    pageSize: number,
    nextOffset: string | null,
    contributionType: string,
    contributionSubtype: string
  ):
    Promise<ContributorAdminStatsData> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.CONTRIBUTOR_ADMIN_STATS_SUMMARIES_URL, {
        contribution_type: contributionType,
        contribution_subtype: contributionSubtype
      }
    );
    return this.http.get<ContributorAdminStatsData>(
      url, {
          page_size: pageSize
          offset: nextOffset
          language_code: filter.languageCode
          sort_by: filter.sort
          topic_ids: filter.topicIds
          max_days_since_last_activity: filter.lastActivity
        }).toPromise().then(response => {
        return {
          stats: response.stats,
          nextOffset: response.next_cursor,
          more: response.more
        };
      }, errorResponse => {
        throw new Error(errorResponse.error.error);
      });
  }
}

angular.module('oppia').factory('ContributorDashboardAdminStatsService',
  downgradeInjectable(ContributorDashboardAdminStatsService));
