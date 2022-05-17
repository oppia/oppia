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
 * @fileoverview Directive for the contributor dashboard admin page.
 */

require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/contributor-dashboard-admin-page/services/' +
  'contributor-dashboard-admin-backend-api.service.ts');
require('services/user.service.ts');

require(
  'pages/contributor-dashboard-admin-page/navbar/' +
  'contributor-dashboard-admin-navbar.component.ts');

angular.module('oppia').directive('contributorDashboardAdminPage', [
  '$rootScope', 'ContributorDashboardAdminBackendApiService',
  'LanguageUtilService', 'UrlInterpolationService', 'UserService',
  'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION',
  'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION',
  'CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER',
  'CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION',
  'USER_FILTER_CRITERION_ROLE', 'USER_FILTER_CRITERION_USERNAME',
  function(
      $rootScope, ContributorDashboardAdminBackendApiService,
      LanguageUtilService, UrlInterpolationService, UserService,
      CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
      CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION,
      CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER,
      CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION,
      USER_FILTER_CRITERION_ROLE, USER_FILTER_CRITERION_USERNAME,) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/contributor-dashboard-admin-page/' +
        'contributor-dashboard-admin-page.component.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.taskRunningInBackground = false;
        ctrl.statusMessage = '';

        var handleErrorResponse = function(errorResponse) {
          ctrl.statusMessage = 'Server error: ' + errorResponse;
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the directive is migrated to angular.
          $rootScope.$apply();
        };

        var getLanguageDescriptions = function(languageCodes) {
          var languageDescriptions = [];
          languageCodes.forEach(function(languageCode) {
            languageDescriptions.push(
              LanguageUtilService.getAudioLanguageDescription(
                languageCode));
          });
          return languageDescriptions;
        };

        ctrl.isLanguageSpecificReviewCategory = function(reviewCategory) {
          return (
            reviewCategory === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION ||
            reviewCategory === CONTRIBUTION_RIGHT_CATEGORY_REVIEW_VOICEOVER);
        };

        ctrl.submitAddContributionRightsForm = function(formResponse) {
          if (ctrl.taskRunningInBackground) {
            return;
          }
          ctrl.statusMessage = 'Adding contribution rights...';
          ctrl.taskRunningInBackground = true;
          ContributorDashboardAdminBackendApiService
            .addContributionReviewerAsync(
              formResponse.category, formResponse.username,
              formResponse.languageCode
            ).then(() => {
              ctrl.statusMessage = 'Success.';
              refreshFormData();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, handleErrorResponse);
          ctrl.taskRunningInBackground = false;
        };

        ctrl.submitViewContributorUsersForm = function(formResponse) {
          if (ctrl.taskRunningInBackground) {
            return;
          }
          ctrl.statusMessage = 'Processing query...';
          ctrl.taskRunningInBackground = true;
          ctrl.contributionReviewersResult = {};
          if (formResponse.filterCriterion === USER_FILTER_CRITERION_ROLE) {
            ContributorDashboardAdminBackendApiService
              .viewContributionReviewersAsync(
                formResponse.category, formResponse.languageCode
              ).then((usersObject) => {
                ctrl.contributionReviewersResult.usernames = (
                  usersObject.usernames);
                ctrl.contributionReviewersDataFetched = true;
                ctrl.statusMessage = 'Success.';
                refreshFormData();
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular.
                $rootScope.$apply();
              }, handleErrorResponse);
          } else {
            ContributorDashboardAdminBackendApiService
              .contributionReviewerRightsAsync(
                formResponse.username
              ).then((contributionRights) => {
                if (
                  ctrl.CONTRIBUTION_RIGHT_CATEGORIES.hasOwnProperty(
                    'REVIEW_TRANSLATION')) {
                  ctrl.contributionReviewersResult = {
                    REVIEW_TRANSLATION: getLanguageDescriptions(
                      contributionRights
                        .can_review_translation_for_language_codes)
                  };
                }
                if (
                  ctrl.CONTRIBUTION_RIGHT_CATEGORIES.hasOwnProperty(
                    'REVIEW_QUESTION')) {
                  ctrl.contributionReviewersResult.REVIEW_QUESTION = (
                    contributionRights.can_review_questions),
                  ctrl.contributionReviewersResult.SUBMIT_QUESTION = (
                    contributionRights.can_submit_questions);
                }
                ctrl.contributionReviewersDataFetched = true;
                ctrl.statusMessage = 'Success.';
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular.
                $rootScope.$apply();
                refreshFormData();
              }, handleErrorResponse);
          }
          ctrl.taskRunningInBackground = false;
        };

        ctrl.submitRemoveContributionRightsForm = function(formResponse) {
          if (ctrl.taskRunningInBackground) {
            return;
          }
          ctrl.statusMessage = 'Processing query...';
          ctrl.taskRunningInBackground = true;
          ContributorDashboardAdminBackendApiService
            .removeContributionReviewerAsync(
              formResponse.username, formResponse.category,
              formResponse.languageCode
            ).then(() => {
              ctrl.statusMessage = 'Success.';
              refreshFormData();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, handleErrorResponse);
          ctrl.taskRunningInBackground = false;
        };

        ctrl.submitViewTranslationContributionStatsForm = function(
            formResponse) {
          if (ctrl.taskRunningInBackground) {
            return;
          }
          ctrl.statusMessage = 'Processing query...';
          ctrl.taskRunningInBackground = true;
          ContributorDashboardAdminBackendApiService
            .viewTranslationContributionStatsAsync(
              formResponse.username
            ).then(response => {
              ctrl.translationContributionStatsResults = (
                response.translation_contribution_stats);
              ctrl.translationContributionStatsFetched = true;
              ctrl.statusMessage = 'Success.';
              refreshFormData();
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the directive is migrated to angular.
              $rootScope.$apply();
            }, handleErrorResponse);
          ctrl.taskRunningInBackground = false;
        };

        var refreshFormData = function() {
          ctrl.formData = {
            viewContributionReviewers: {
              filterCriterion: USER_FILTER_CRITERION_ROLE,
              username: '',
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.filterCriterion === USER_FILTER_CRITERION_ROLE) {
                  if (this.category === null) {
                    return false;
                  }
                  if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                    return Boolean(this.languageCode);
                  }
                  return true;
                }

                if (this.filterCriterion === USER_FILTER_CRITERION_USERNAME) {
                  return Boolean(this.username);
                }
              }
            },
            addContributionReviewer: {
              username: '',
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.username === '') {
                  return false;
                }
                if (this.category === null) {
                  return false;
                }
                if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                  return Boolean(this.languageCode);
                }
                return true;
              }
            },
            removeContributionReviewer: {
              username: '',
              category: null,
              languageCode: null,
              isValid: function() {
                if (this.username === '' || this.category === null) {
                  return false;
                }
                if (ctrl.isLanguageSpecificReviewCategory(this.category)) {
                  return Boolean(this.languageCode);
                }
                return true;
              }
            },
            viewTranslationContributionStats: {
              username: '',
              isValid: function() {
                if (this.username === '') {
                  return false;
                }
                return true;
              }
            }
          };
        };

        ctrl.$onInit = function() {
          UserService.getUserInfoAsync().then((userInfo) => {
            let translationCategories = {};
            let questionCategories = {};
            if (userInfo.isTranslationAdmin()) {
              translationCategories = {
                REVIEW_TRANSLATION: (
                  CONTRIBUTION_RIGHT_CATEGORY_REVIEW_TRANSLATION)
              };
            }
            if (userInfo.isQuestionAdmin()) {
              questionCategories = {
                REVIEW_QUESTION: CONTRIBUTION_RIGHT_CATEGORY_REVIEW_QUESTION,
                SUBMIT_QUESTION: CONTRIBUTION_RIGHT_CATEGORY_SUBMIT_QUESTION
              };
            }
            ctrl.CONTRIBUTION_RIGHT_CATEGORIES = {
              ...translationCategories,
              ...questionCategories
            };
            $rootScope.$apply();
          });

          ctrl.USER_FILTER_CRITERION_USERNAME = USER_FILTER_CRITERION_USERNAME;
          ctrl.USER_FILTER_CRITERION_ROLE = USER_FILTER_CRITERION_ROLE;

          refreshFormData();
          ctrl.contributionReviewersDataFetched = false;
          ctrl.contributionReviewersResult = {};
          ctrl.translationContributionStatsFetched = false;
          ctrl.translationContributionStatsResults = [];
          ctrl.statusMessage = '';

          ctrl.languageCodesAndDescriptions = (
            LanguageUtilService.getAllVoiceoverLanguageCodes().map(
              function(languageCode) {
                return {
                  id: languageCode,
                  description: (
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode))
                };
              }));
        };

        ctrl.clearResults = function() {
          ctrl.contributionReviewersDataFetched = false;
          ctrl.contributionReviewersResult = {};
        };
      }]
    };
  }
]);
