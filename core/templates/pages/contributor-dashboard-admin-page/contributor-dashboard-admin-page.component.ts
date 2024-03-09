// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Contributor dashboard admin page component.
 */

import { Component, OnInit } from '@angular/core';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UserService } from 'services/user.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { ContributorDashboardAdminBackendApiService } from './services/contributor-dashboard-admin-backend-api.service';
import { AppConstants } from 'app.constants';

interface ViewContributionReviewers {
  filterCriterion: string;
  username: string;
  category: string | null;
  languageCode: string;
  isValid: () => boolean;
}

interface AddContributionReviewer {
  username: string;
  category: string | null;
  languageCode: string;
  isValid: () => boolean;
}

interface RemoveContributionReviewer {
  method: string;
  username: string;
  category: string | null;
  languageCode: string;
  isValid: () => boolean;
}

interface ViewTranslationContributionStats {
  username: string;
  isValid: () => boolean;
}

interface FormData {
  viewContributionReviewers: ViewContributionReviewers;
  addContributionReviewer: AddContributionReviewer;
  removeContributionReviewer: RemoveContributionReviewer;
  viewTranslationContributionStats: ViewTranslationContributionStats;
}

interface TranslationContributionStat {
  language: string;
  topic_name: string;
  submitted_translations_count: number;
  submitted_translation_word_count: number;
  accepted_translations_count: number;
  accepted_translations_without_reviewer_edits_count: number;
  accepted_translation_word_count: number;
  rejected_translations_count: number;
  rejected_translation_word_count: number;
  contribution_months: string[];
}

interface ContributionReviewersResult {
  usernames?: string[];
  REVIEW_TRANSLATION?: string[];
  REVIEW_QUESTION?: boolean;
  SUBMIT_QUESTION?: boolean;
}

interface LanguageCodeDescription {
  id: string;
  description: string;
}
@Component({
  selector: 'contributor-dashboard-admin-page',
  templateUrl: './contributor-dashboard-admin-page.component.html',
})
export class ContributorDashboardAdminPageComponent implements OnInit {
  taskRunningInBackground: boolean = false;
  statusMessage: string = '';
  UserIsTranslationAdmin: boolean = false;
  isNewUiEnabled: boolean = false;

  USER_FILTER_CRITERION_ROLE: string;
  USER_FILTER_CRITERION_USERNAME: string;
  CD_USER_RIGHTS_CATEGORIES: Record<string, string>;

  contributionReviewersDataFetched: boolean = false;
  contributionReviewersResult: ContributionReviewersResult = {};
  translationContributionStatsFetched: boolean;
  translationContributionStatsResults: TranslationContributionStat[] = [];
  languageCodesAndDescriptions: LanguageCodeDescription[] = [];
  formData!: FormData;

  constructor(
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService,
    private contributorDashboardAdminBackendApiService:
     ContributorDashboardAdminBackendApiService,
    private languageUtilService: LanguageUtilService,
  ) { }


  refreshFormData(): void {
    this.formData = {
      viewContributionReviewers: {
        filterCriterion: AppConstants.USER_FILTER_CRITERION_ROLE,
        username: '',
        category: null,
        languageCode: null,
        isValid: () => {
          if (this.formData.viewContributionReviewers.filterCriterion ===
             AppConstants.USER_FILTER_CRITERION_ROLE) {
            if (this.formData.viewContributionReviewers.category === null) {
              return false;
            }
            if (this.isLanguageSpecificReviewCategory(
              this.formData.viewContributionReviewers.category)) {
              return Boolean(
                this.formData.viewContributionReviewers.languageCode);
            }
            return true;
          }

          if (this.formData.viewContributionReviewers.filterCriterion ===
             AppConstants.USER_FILTER_CRITERION_USERNAME) {
            return Boolean(this.formData.viewContributionReviewers.username);
          }
        }
      },
      addContributionReviewer: {
        username: '',
        category: null,
        languageCode: null,
        isValid: () => {
          if (this.formData.addContributionReviewer.username === '') {
            return false;
          }
          if (this.formData.addContributionReviewer.category === null) {
            return false;
          }
          if (this.isLanguageSpecificReviewCategory(
            this.formData.addContributionReviewer.category)) {
            return Boolean(this.formData.addContributionReviewer.languageCode);
          }
          return true;
        }
      },
      removeContributionReviewer: {
        username: '',
        category: null,
        languageCode: null,
        isValid: () => {
          if (this.formData.removeContributionReviewer.username === '' ||
            this.formData.removeContributionReviewer.category === null) {
            return false;
          }
          if (this.isLanguageSpecificReviewCategory(
            this.formData.removeContributionReviewer.category)) {
            return Boolean(
              this.formData.removeContributionReviewer.languageCode);
          }
          return true;
        },
        method: ''
      },
      viewTranslationContributionStats: {
        username: '',
        isValid: () => {
          if (this.formData.viewTranslationContributionStats.username === '') {
            return false;
          }
          return true;
        }
      }
    };
  }

  ngOnInit(): void {
    this.isNewUiEnabled = (
      this.platformFeatureService.status.CdAdminDashboardNewUi.isEnabled);
    this.userService.getUserInfoAsync().then((userInfo) => {
      let translationCategories = {};
      let questionCategories = {};
      if (userInfo.isTranslationAdmin()) {
        this.UserIsTranslationAdmin = true;
        translationCategories = {
          REVIEW_TRANSLATION: (
            AppConstants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION)
        };
      }
      if (userInfo.isQuestionAdmin() ||
        userInfo.isQuestionCoordinator()) {
        questionCategories = {
          REVIEW_QUESTION: AppConstants.CD_USER_RIGHTS_CATEGORY_REVIEW_QUESTION,
          SUBMIT_QUESTION: AppConstants.CD_USER_RIGHTS_CATEGORY_SUBMIT_QUESTION
        };
      }
      this.CD_USER_RIGHTS_CATEGORIES = {
        ...translationCategories,
        ...questionCategories
      };
    });

    this.USER_FILTER_CRITERION_USERNAME =
     AppConstants.USER_FILTER_CRITERION_USERNAME;
    this.USER_FILTER_CRITERION_ROLE =
     AppConstants.USER_FILTER_CRITERION_ROLE;

    this.refreshFormData();
    this.contributionReviewersDataFetched = false;
    this.contributionReviewersResult = {};
    this.translationContributionStatsFetched = false;
    this.translationContributionStatsResults = [];
    this.statusMessage = '';

    this.languageCodesAndDescriptions =
     this.languageUtilService.getAllVoiceoverLanguageCodes().map(
       (languageCode) => {
         return {
           id: languageCode,
           description:
            this.languageUtilService.getAudioLanguageDescription(languageCode)
         };
       }
     );
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    const languageDescriptions: string[] = [];
    languageCodes.forEach((languageCode) => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(languageCode));
    });
    return languageDescriptions;
  }

  isLanguageSpecificReviewCategory(reviewCategory: string): boolean {
    return (
      reviewCategory ===
       AppConstants.CD_USER_RIGHTS_CATEGORY_REVIEW_TRANSLATION);
  }

  submitAddContributionRightsForm(formResponse: AddContributionReviewer): void {
    if (this.taskRunningInBackground) {
      return;
    }
    this.statusMessage = 'Adding contribution rights...';
    this.taskRunningInBackground = true;

    this.contributorDashboardAdminBackendApiService
      .addContributionReviewerAsync(
        formResponse.category, formResponse.username, formResponse.languageCode
      ).then(() => {
        this.statusMessage = 'Success.';
        this.refreshFormData();
      }, errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
      });
    this.taskRunningInBackground = false;
  }

  submitViewContributorUsersForm(
      formResponse: ViewContributionReviewers): void {
    if (this.taskRunningInBackground) {
      return;
    }
    this.statusMessage = 'Processing query...';
    this.taskRunningInBackground = true;
    this.contributionReviewersResult = {};

    if (formResponse.filterCriterion ===
       AppConstants.USER_FILTER_CRITERION_ROLE) {
      this.contributorDashboardAdminBackendApiService
        .viewContributionReviewersAsync(
          formResponse.category, formResponse.languageCode
        ).then((usersObject) => {
          this.contributionReviewersResult.usernames = usersObject.usernames;
          this.contributionReviewersDataFetched = true;
          this.statusMessage = 'Success.';
          const temp = this.formData.viewContributionReviewers.filterCriterion;
          this.refreshFormData();
          this.formData.viewContributionReviewers.filterCriterion = temp;
        });
    } else {
      this.contributorDashboardAdminBackendApiService
        .contributionReviewerRightsAsync(
          formResponse.username
        ).then((contributionRights) => {
          if (this.CD_USER_RIGHTS_CATEGORIES.hasOwnProperty(
            'REVIEW_TRANSLATION')) {
            this.contributionReviewersResult = {
              REVIEW_TRANSLATION: this.getLanguageDescriptions(
                contributionRights.can_review_translation_for_language_codes)
            };
          }
          if (this.CD_USER_RIGHTS_CATEGORIES.hasOwnProperty(
            'REVIEW_QUESTION')) {
            this.contributionReviewersResult.REVIEW_QUESTION =
              contributionRights.can_review_questions;
            this.contributionReviewersResult.SUBMIT_QUESTION =
              contributionRights.can_submit_questions;
          }
          this.contributionReviewersDataFetched = true;
          this.statusMessage = 'Success.';
          const temp = this.formData.viewContributionReviewers.filterCriterion;
          this.refreshFormData();
          this.formData.viewContributionReviewers.filterCriterion = temp;
        }, errorResponse => {
          this.statusMessage = 'Server error: ' + errorResponse;
        });
    }
    this.taskRunningInBackground = false;
  }

  submitRemoveContributionRightsForm(
      formResponse: RemoveContributionReviewer): void {
    if (this.taskRunningInBackground) {
      return;
    }
    this.statusMessage = 'Processing query...';
    this.taskRunningInBackground = true;

    this.contributorDashboardAdminBackendApiService
      .removeContributionReviewerAsync(
        formResponse.username, formResponse.category, formResponse.languageCode
      ).then(() => {
        this.statusMessage = 'Success.';
        this.refreshFormData();
      }, errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
      });

    this.taskRunningInBackground = false;
  }

  submitViewTranslationContributionStatsForm(
      formResponse: ViewTranslationContributionStats): void {
    if (this.taskRunningInBackground) {
      return;
    }
    this.statusMessage = 'Processing query...';
    this.taskRunningInBackground = true;

    this.contributorDashboardAdminBackendApiService
      .viewTranslationContributionStatsAsync(
        formResponse.username
      ).then(response => {
        this.translationContributionStatsResults =
          response.translation_contribution_stats;
        this.translationContributionStatsFetched = true;
        this.statusMessage = 'Success.';
        this.refreshFormData();
      }, errorResponse => {
        this.statusMessage = 'Server error: ' + errorResponse;
      });

    this.taskRunningInBackground = false;
  }

  clearResults(): void {
    this.contributionReviewersDataFetched = false;
    this.contributionReviewersResult = {};
  }
}
