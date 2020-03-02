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
 * @fileoverview Directive for showing and reviewing contributions.
 */

require('base-components/base-content.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('domain/question/QuestionObjectFactory.ts');
require('filters/format-rte-preview.filter.ts');
require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');
require(
  'pages/community-dashboard-page/login-required-message/' +
  'login-required-message.directive.ts');

require(
  'pages/community-dashboard-page/services/' +
  'contribution-and-review.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').directive('contributionsAndReview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    let SUGGESTION_LABELS = {
      review: { text: 'Awaiting review', color: '#eeeeee' },
      accepted: { text: 'Accepted', color: '#8ed274' },
      rejected: { text: 'Rejected', color: '#e76c8c' }
    };

    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/contributions-and-review/' +
        'contributions-and-review.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', '$uibModal', 'ContributionAndReviewService',
        'QuestionObjectFactory', 'UserService',
        function(
            $filter, $uibModal, ContributionAndReviewService,
            QuestionObjectFactory, UserService) {
          const ctrl = this;

          ctrl.$onInit = () => {
            ctrl.isAdmin = false;
            ctrl.userDetailsLoading = true;
            ctrl.userIsLoggedIn = false;
            ctrl.contributions = {};
            ctrl.contributionSummaries = [];
            ctrl.contributionsDataLoading = true;
            ctrl.SUGGESTION_TYPE_QUESTION = 'add_question';
            ctrl.SUGGESTION_TYPE_TRANSLATE = 'translate_content';
            ctrl.reviewTabs = [
              {
                suggestionType: ctrl.SUGGESTION_TYPE_QUESTION,
                text: 'Review Questions'
              },
              {
                suggestionType: ctrl.SUGGESTION_TYPE_TRANSLATE,
                text: 'Review Translations'
              }
            ];
            ctrl.contributionTabs = [
              {
                suggestionType: ctrl.SUGGESTION_TYPE_QUESTION,
                text: 'Questions'
              },
              {
                suggestionType: ctrl.SUGGESTION_TYPE_TRANSLATE,
                text: 'Translations'
              }
            ];
            ctrl.suggestionActionsByType = {
              [ctrl.SUGGESTION_TYPE_QUESTION]: {
                viewSuggestion: (suggestionId) => {
                  let suggestion = ctrl.contributions[suggestionId].suggestion;
                  let contributionDetails =
                    ctrl.contributions[suggestionId].details;
                  let isReviewable =
                    ctrl.activeReviewTab === ctrl.SUGGESTION_TYPE_QUESTION;
                  showQuestionSuggestionModal(
                    suggestion, contributionDetails, isReviewable);
                },
                switchToContributionsTab: () => {
                  ContributionAndReviewService
                    .getUserCreatedQuestionSuggestions(
                      suggestionIdToSuggestions => {
                        ctrl.contributions = suggestionIdToSuggestions;
                        ctrl.contributionSummaries =
                          getQuestionContributionsSummary();
                        ctrl.activeContributionTab =
                          ctrl.SUGGESTION_TYPE_QUESTION;
                        ctrl.contributionsDataLoading = false;
                      });
                },
                switchToReviewTab: () => {
                  ContributionAndReviewService.getReviewableQuestionSuggestions(
                    function(suggestionIdToSuggestions) {
                      ctrl.contributions = suggestionIdToSuggestions;
                      ctrl.contributionSummaries =
                        getQuestionContributionsSummary();
                      ctrl.activeReviewTab = ctrl.SUGGESTION_TYPE_QUESTION;
                      ctrl.contributionsDataLoading = false;
                    });
                }
              },

              [ctrl.SUGGESTION_TYPE_TRANSLATE]: {
                viewSuggestion: (suggestionId) => {
                  let suggestion = ctrl.contributions[suggestionId].suggestion;
                  let isReviewable =
                    ctrl.activeReviewTab === ctrl.SUGGESTION_TYPE_TRANSLATE;
                  showTranslationSuggestionModal(
                    suggestion.target_id, suggestion.suggestion_id,
                    suggestion.change.content_html,
                    suggestion.change.translation_html, isReviewable);
                },
                switchToContributionsTab: () => {
                  ContributionAndReviewService
                    .getUserCreatedTranslationSuggestions(
                      suggestionIdToSuggestions => {
                        ctrl.contributions = suggestionIdToSuggestions;
                        ctrl.contributionSummaries =
                          getTranslationContributionsSummary();
                        ctrl.activeContributionTab =
                          ctrl.SUGGESTION_TYPE_TRANSLATE;
                        ctrl.contributionsDataLoading = false;
                      });
                },
                switchToReviewTab: () => {
                  ContributionAndReviewService
                    .getReviewableTranslationSuggestions(
                      suggestionIdToSuggestions => {
                        ctrl.contributions = suggestionIdToSuggestions;
                        ctrl.contributionSummaries =
                          getTranslationContributionsSummary();
                        ctrl.activeReviewTab = ctrl.SUGGESTION_TYPE_TRANSLATE;
                        ctrl.contributionsDataLoading = false;
                      });
                }
              }
            };

            ctrl.activeReviewTab = '';
            ctrl.activeContributionTab = '';

            UserService.getUserInfoAsync().then(userInfo => {
              ctrl.isAdmin = userInfo.isAdmin();
              ctrl.userIsLoggedIn = userInfo.isLoggedIn();
              ctrl.userDetailsLoading = false;
              if (ctrl.isAdmin) {
                ctrl.switchToReviewTab(ctrl.SUGGESTION_TYPE_QUESTION);
              } else if (ctrl.userIsLoggedIn) {
                ctrl.switchToContributionsTab(ctrl.SUGGESTION_TYPE_QUESTION);
              }
            });
          };

          let getQuestionContributionsSummary = (
            // TODO(#7176): Replace 'any' with the exact type. This has been
            // kept as 'any' because 'contribution' is a dict with
            // underscore_cased keys which give tslint errors about accessing an
            // unknown type.
            () => Object.values(ctrl.contributions).map((contribution: any) => {
              let change = contribution.suggestion.change;
              let status = contribution.suggestion.status;
              let suggestionId = contribution.suggestion.suggestionn_id;
              let topicName = change.topic_name;
              let html = change.question_dict.question_state_data.content.html;
              let skillDescription = contribution.details.skill_description;

              return {
                id: suggestionId,
                heading: $filter('formatRtePreview')(html),
                subheading: [topicName, skillDescription].join(' / '),
                labelText: SUGGESTION_LABELS[status].text,
                labelColor: SUGGESTION_LABELS[status].color,
                actionButtonTitle: (
                  ctrl.activeReviewTab === ctrl.SUGGESTION_TYPE_QUESTION
                  ? 'Review' : 'View')
              };
            }));

          let getTranslationContributionsSummary = (
            // TODO(#7176): Replace 'any' with the exact type. This has been
            // kept as 'any' because 'contribution' is a dict with
            // underscore_cased keys which give tslint errors about accessing an
            // unknown type.
            () => Object.values(ctrl.contributions).map((contribution: any) => {
              let chapterTitle = contribution.details.chapter_title;
              let storyTitle = contribution.details.story_title;
              let topicName  = contribution.details.topic_name;
              let status = contribution.suggestion.status;
              let suggestionId = contribution.suggestion.suggestionn_id;
              let translationHtml =
                contribution.suggestion.change.translation_html;

              return {
                id: suggestionId,
                heading: $filter('formatRtePreview')(translationHtml),
                subheading: [topicName, storyTitle, chapterTitle].join(' / '),
                labelText: SUGGESTION_LABELS[status].text,
                labelColor: SUGGESTION_LABELS[status].color,
                actionButtonTitle: (
                  ctrl.activeReviewTab === ctrl.SUGGESTION_TYPE_TRANSLATE
                  ? 'Review' : 'View')
              };
            }));

          let removeContributionToReview = suggestionId => {
            ctrl.contributionSummaries = ctrl.contributionSummaries.filter(
              suggestion => suggestion.id !== suggestionId);
          };

          let showQuestionSuggestionModal = (
            (suggestion, contributionDetails, reviewable) => {
              let authorName = suggestion.author_name;
              let suggestionId = suggestion.suggestion_id;
              let targetId = suggestion.target_id;
              let questionDict = suggestion.change.question_dict;
              let topicName = suggestion.change.topic_name;
              let skillDescription = contributionDetails.skill_description;

              let question = QuestionObjectFactory.createFromBackendDict(
                questionDict);
              let contentHtml = question.getStateData().content.getHtml();
              let questionHeader = [topicName, skillDescription].join(' / ');

              return $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/community-dashboard-page/modal-templates/' +
                  'question-suggestion-review.directive.html'),
                backdrop: true,
                size: 'lg',
                resolve: {
                  question: () => question,
                  reviewable: () => reviewable
                },
                controller: [
                  '$scope', '$uibModalInstance', 'SuggestionModalService',
                  'question', 'reviewable',
                  function(
                      $scope, $uibModalInstance, SuggestionModalService,
                      question, reviewable) {
                    $scope.authorName = authorName;
                    $scope.contentHtml = contentHtml;
                    $scope.reviewable = reviewable;
                    $scope.commitMessage = '';
                    $scope.reviewMessage = '';
                    $scope.question = question;
                    $scope.questionHeader = questionHeader;
                    $scope.questionStateData = question.getStateData();
                    $scope.questionId = question.getId();
                    $scope.canEditQuestion = false;
                    $scope.misconceptionsBySkill = [];

                    $scope.questionChanged = () => {
                      $scope.validationError = null;
                    };
                    $scope.accept = () => {
                      return SuggestionModalService.acceptSuggestion(
                        $uibModalInstance, {
                          action: (
                            SuggestionModalService.ACTION_ACCEPT_SUGGESTION),
                          commitMessage: $scope.commitMessage,
                          reviewMessage: $scope.reviewMessage
                        });
                    };
                    $scope.reject = () => {
                      return SuggestionModalService.rejectSuggestion(
                        $uibModalInstance, {
                          action: (
                            SuggestionModalService.ACTION_REJECT_SUGGESTION),
                          reviewMessage: $scope.reviewMessage
                        });
                    };
                    $scope.cancel = () => {
                      return SuggestionModalService.cancelSuggestion(
                        $uibModalInstance);
                    };
                  }
                ]
              }).result.then(result => {
               return ContributionAndReviewService.resolveSuggestiontoSkill(
                  targetId, suggestionId, result.action, result.reviewMessage,
                  result.commitMessage, removeContributionToReview);
              });
            });

          let showTranslationSuggestionModal = (
              targetId, suggestionId, contentHtml, translationHtml,
              reviewable) => {
            return $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/community-dashboard-page/modal-templates/' +
                'translation-suggestion-review.directive.html'),
              backdrop: true,
              size: 'lg',
              resolve: {
                translationHtml: () => translationHtml,
                contentHtml: () => contentHtml,
                reviewable: () => reviewable
              },
              controller: [
                '$scope', '$uibModalInstance', 'SuggestionModalService',
                'reviewable', 'translationHtml', 'contentHtml',
                function(
                    $scope, $uibModalInstance, SuggestionModalService,
                    reviewable, translationHtml, contentHtml) {
                  $scope.translationHtml = translationHtml;
                  $scope.contentHtml = contentHtml;
                  $scope.reviewable = reviewable;
                  $scope.commitMessage = '';
                  $scope.reviewMessage = '';
                  $scope.accept = () => {
                    return SuggestionModalService.acceptSuggestion(
                      $uibModalInstance, {
                        action: (
                          SuggestionModalService.ACTION_ACCEPT_SUGGESTION),
                        commitMessage: $scope.commitMessage,
                        reviewMessage: $scope.reviewMessage
                      });
                  };
                  $scope.reject = () => {
                    return SuggestionModalService.rejectSuggestion(
                      $uibModalInstance, {
                        action: (
                          SuggestionModalService.ACTION_REJECT_SUGGESTION),
                        reviewMessage: $scope.reviewMessage
                      });
                  };
                  $scope.cancel = () => {
                    return SuggestionModalService.cancelSuggestion(
                      $uibModalInstance);
                  };
                }
              ]
            }).result.then(result => {
              ContributionAndReviewService.resolveSuggestiontoExploration(
                targetId, suggestionId, result.action, result.reviewMessage,
                result.commitMessage, removeContributionToReview);
            });
          };

          ctrl.onClickViewSuggestion = suggestionId => {
            let suggestionType =
              ctrl.contributions[suggestionId].suggestion.suggestion_type;
            let viewSuggestion =
              ctrl.suggestionActionsByType[suggestionType].viewSuggestion;
            if (viewSuggestion) {
              viewSuggestion();
            }
          };

          ctrl.switchToContributionsTab = suggestionType => {
            ctrl.activeReviewTab = '';
            ctrl.contributionsDataLoading = true;
            ctrl.contributionSummaries = [];

            let switchToContributionsTab = ctrl.suggestionActionsByType[
              suggestionType].switchToContributionsTab;
            if (switchToContributionsTab) {
              switchToContributionsTab();
            }
          };

          ctrl.switchToReviewTab = suggestionType => {
            ctrl.activeContributionTab = '';
            ctrl.contributionsDataLoading = true;
            ctrl.contributionSummaries = [];

            let switchToReviewTab = ctrl.suggestionActionsByType[
              suggestionType].switchToReviewTab;
            if (switchToReviewTab) {
              switchToReviewTab();
            }
          };
        }
      ]
    };
  }
]);
