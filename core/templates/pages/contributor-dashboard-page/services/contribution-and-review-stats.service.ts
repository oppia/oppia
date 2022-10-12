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
import { AppConstants } from 'app.constants';
import { ContributionAndReviewStatsBackendApiService }
  from './contribution-and-review-stats-backend-api.service';

export interface TranslationContributionBackendDict {
   'language_code': string;
   'topic_name': string;
   'submitted_translations_count': number;
   'submitted_translation_word_count': number;
   'accepted_translations_count': number;
   'accepted_translations_without_reviewer_edits_count': number;
   'accepted_translation_word_count': number;
   'rejected_translations_count': number;
   'rejected_translation_word_count': number;
   'first_contribution_date': string;
   'last_contribution_date': string;
}

export interface TranslationReviewBackendDict {
   'language_code': string;
   'topic_name': string;
   'reviewed_translations_count': number;
   'reviewed_translation_word_count': number;
   'accepted_translations_count': number;
   'accepted_translations_with_reviewer_edits_count': number;
   'accepted_translation_word_count': number;
   'first_contribution_date': string;
   'last_contribution_date': string;
}

export interface QuestionContributionBackendDict {
   'topic_name': string;
   'submitted_questions_count': number;
   'accepted_questions_count': number;
   'accepted_questions_without_reviewer_edits_count': number;
   'first_contribution_date': string;
   'last_contribution_date': string;
}

export interface QuestionReviewBackendDict {
   'topic_name': string;
   'reviewed_questions_count': number;
   'accepted_questions_count': number;
   'accepted_questions_with_reviewer_edits_count': number;
   'first_contribution_date': string;
   'last_contribution_date': string;
}

export interface ContributorStatsSummaryBackendDict {
   'translation_contribution_stats': [TranslationContributionBackendDict];
   'translation_review_stats': [TranslationReviewBackendDict];
   'question_contribution_stats': [QuestionContributionBackendDict];
   'question_review_stats': [QuestionReviewBackendDict];
}

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewStatsService {
  constructor(
    private contributionAndReviewStatsBackendApiService:
      ContributionAndReviewStatsBackendApiService
  ) {}

  async fetchAllStats(
      username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    return (
      this.contributionAndReviewStatsBackendApiService
        .fetchAllContributionAndReviewStatsAsync(username));
  }

  async fetchTranslationContributionStats(
      username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    return (
      this.contributionAndReviewStatsBackendApiService
        .fetchContributionAndReviewStatsAsync(
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION, username));
  }

  async fetchTranslationReviewStats(
      username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    return (
      this.contributionAndReviewStatsBackendApiService
        .fetchContributionAndReviewStatsAsync(
          AppConstants.CONTRIBUTION_STATS_TYPE_TRANSLATION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW, username));
  }

  async fetchQuestionContributionStats(
      username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    return (
      this.contributionAndReviewStatsBackendApiService
        .fetchContributionAndReviewStatsAsync(
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION, username));
  }

  async fetchQuestionReviewStats(
      username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    return (
      this.contributionAndReviewStatsBackendApiService
        .fetchContributionAndReviewStatsAsync(
          AppConstants.CONTRIBUTION_STATS_TYPE_QUESTION,
          AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW, username));
  }
}

angular.module('oppia').factory('ContributionAndReviewStatsService',
  downgradeInjectable(ContributionAndReviewStatsService));
