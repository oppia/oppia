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
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('filters/format-rte-preview.filter.ts');
require('interactions/interactionsQuestionsRequires.ts');
require('objects/objectComponentsRequires.ts');
require(
  'pages/contributor-dashboard-page/login-required-message/' +
  'login-required-message.component.ts');
require(
  'pages/contributor-dashboard-page/modal-templates/' +
  'question-suggestion-review-modal.controller.ts');
require(
  'pages/contributor-dashboard-page/modal-templates/' +
  'translation-suggestion-review-modal.controller.ts');

require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-and-review.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').component('contributionsAndReview', {
  template: require('./contributions-and-review.component.html'),
  controller: [
    '$filter', '$rootScope', '$uibModal', 'AlertsService', 'ContextService',
    'ContributionAndReviewService', 'ContributionOpportunitiesService',
    'QuestionObjectFactory', 'SkillBackendApiService',
    'UrlInterpolationService', 'UserService', 'IMAGE_CONTEXT',
    function(
        $filter, $rootScope, $uibModal, AlertsService, ContextService,
        ContributionAndReviewService, ContributionOpportunitiesService,
        QuestionObjectFactory, SkillBackendApiService,
        UrlInterpolationService, UserService, IMAGE_CONTEXT) {
      var ctrl = this;
      ctrl.contributions = {};

      var SUGGESTION_LABELS = {
        review: {
          text: 'Awaiting review',
          color: '#eeeeee'
        },
        accepted: {
          text: 'Accepted',
          color: '#8ed274'
        },
        rejected: {
          text: 'Rejected',
          color: '#e76c8c'
        }
      };
      var SUGGESTION_TYPE_QUESTION = 'add_question';
      var SUGGESTION_TYPE_TRANSLATE = 'translate_content';
      ctrl.TAB_TYPE_CONTRIBUTIONS = 'contributions';
      ctrl.TAB_TYPE_REVIEWS = 'reviews';

      var tabNameToOpportunityFetchFunction = {
        [SUGGESTION_TYPE_QUESTION]: {
          [ctrl.TAB_TYPE_CONTRIBUTIONS]: (
            ContributionAndReviewService.getUserCreatedQuestionSuggestionsAsync
          ),
          [ctrl.TAB_TYPE_REVIEWS]: (
            ContributionAndReviewService.getReviewableQuestionSuggestionsAsync)
        },
        [SUGGESTION_TYPE_TRANSLATE]: {
          [ctrl.TAB_TYPE_CONTRIBUTIONS]: (
            ContributionAndReviewService
              .getUserCreatedTranslationSuggestionsAsync),
          [ctrl.TAB_TYPE_REVIEWS]: (
            ContributionAndReviewService
              .getReviewableTranslationSuggestionsAsync)
        }
      };

      var getQuestionContributionsSummary = function(
          suggestionIdToSuggestions) {
        var questionContributionsSummaryList = [];
        Object.keys(suggestionIdToSuggestions).forEach(function(key) {
          var suggestion = suggestionIdToSuggestions[key].suggestion;
          var details = suggestionIdToSuggestions[key].details;
          var subheading = '';
          if (details === null) {
            subheading = '[The corresponding opportunity has been deleted.]';
          } else {
            subheading = details.skill_description;
          }

          var change = suggestion.change;
          var requiredData = {
            id: suggestion.suggestion_id,
            heading: $filter('formatRtePreview')(
              change.question_dict.question_state_data.content.html),
            subheading: subheading,
            labelText: SUGGESTION_LABELS[suggestion.status].text,
            labelColor: SUGGESTION_LABELS[suggestion.status].color,
            actionButtonTitle: (
              ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS ? 'Review' : 'View')
          };
          questionContributionsSummaryList.push(requiredData);
        });
        return questionContributionsSummaryList;
      };

      var getTranslationContributionsSummary = function(
          suggestionIdToSuggestions) {
        var translationContributionsSummaryList = [];
        Object.keys(suggestionIdToSuggestions).forEach(function(key) {
          var suggestion = suggestionIdToSuggestions[key].suggestion;
          var details = suggestionIdToSuggestions[key].details;
          var subheading = '';
          if (details === null) {
            subheading = '[The corresponding opportunity has been deleted.]';
          } else {
            subheading = (
              details.topic_name + ' / ' + details.story_title +
              ' / ' + details.chapter_title);
          }

          var change = suggestion.change;
          var requiredData = {
            id: suggestion.suggestion_id,
            heading: $filter('formatRtePreview')(change.translation_html),
            subheading: subheading,
            labelText: SUGGESTION_LABELS[suggestion.status].text,
            labelColor: SUGGESTION_LABELS[suggestion.status].color,
            actionButtonTitle: (
              ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS ? 'Review' : 'View')
          };
          translationContributionsSummaryList.push(requiredData);
        });
        return translationContributionsSummaryList;
      };

      var resolveSuggestionSuccess = function(suggestionId) {
        AlertsService.addSuccessMessage('Submitted suggestion review.');
        ContributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
          [suggestionId]);
      };

      var _showQuestionSuggestionModal = function(
          suggestion, contributionDetails, reviewable,
          misconceptionsBySkill) {
        var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/contributor-dashboard-page/modal-templates/' +
          'question-suggestion-review.directive.html');
        var targetId = suggestion.target_id;
        var suggestionId = suggestion.suggestion_id;
        var authorName = suggestion.author_name;
        var questionHeader = contributionDetails.skill_description;
        var question = QuestionObjectFactory.createFromBackendDict(
          suggestion.change.question_dict);
        var contentHtml = question.getStateData().content.getHtml();
        var skillRubrics = contributionDetails.skill_rubrics;
        var skillDifficulty = suggestion.change.skill_difficulty;

        $uibModal.open({
          templateUrl: _templateUrl,
          backdrop: true,
          size: 'lg',
          resolve: {
            authorName: function() {
              return authorName;
            },
            contentHtml: function() {
              return contentHtml;
            },
            misconceptionsBySkill: function() {
              return misconceptionsBySkill;
            },
            question: function() {
              return question;
            },
            questionHeader: function() {
              return questionHeader;
            },
            reviewable: function() {
              return reviewable;
            },
            skillRubrics: function() {
              return skillRubrics;
            },
            skillDifficulty: function() {
              return skillDifficulty;
            }
          },
          controller: 'QuestionSuggestionReviewModalController'
        }).result.then(function(result) {
          ContributionAndReviewService.resolveSuggestiontoSkill(
            targetId, suggestionId, result.action, result.reviewMessage,
            result.skillDifficulty, resolveSuggestionSuccess);
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      var _showTranslationSuggestionModal = function(
          suggestionIdToSuggestion, initialSuggestionId, reviewable) {
        var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/contributor-dashboard-page/modal-templates/' +
          'translation-suggestion-review.directive.html');

        $uibModal.open({
          templateUrl: _templateUrl,
          backdrop: true,
          size: 'lg',
          resolve: {
            suggestionIdToSuggestion: function() {
              return angular.copy(suggestionIdToSuggestion);
            },
            initialSuggestionId: function() {
              return initialSuggestionId;
            },
            reviewable: function() {
              return reviewable;
            }
          },
          controller: 'TranslationSuggestionReviewModalController'
        }).result.then(function(resolvedSuggestionIds) {
          ContributionOpportunitiesService.removeOpportunitiesEventEmitter.emit(
            resolvedSuggestionIds);
          resolvedSuggestionIds.forEach(function(suggestionId) {
            delete ctrl.contributions[suggestionId];
          });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.isActiveTab = function(tabType, suggestionType) {
        return (
          ctrl.activeTabType === tabType &&
          ctrl.activeSuggestionType === suggestionType);
      };

      ctrl.onClickViewSuggestion = function(suggestionId) {
        var suggestion = ctrl.contributions[suggestionId].suggestion;
        var reviewable = ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS;
        if (suggestion.suggestion_type === SUGGESTION_TYPE_QUESTION) {
          var contributionDetails = ctrl.contributions[suggestionId].details;
          var skillId = suggestion.change.skill_id;
          ContextService.setCustomEntityContext(
            IMAGE_CONTEXT.QUESTION_SUGGESTIONS, skillId);
          SkillBackendApiService.fetchSkill(skillId).then((skillDict) => {
            var misconceptionsBySkill = {};
            var skill = skillDict.skill;
            misconceptionsBySkill[skill.getId()] = skill.getMisconceptions();
            _showQuestionSuggestionModal(
              suggestion, contributionDetails, reviewable,
              misconceptionsBySkill);
            $rootScope.$apply();
          });
        }
        if (suggestion.suggestion_type === SUGGESTION_TYPE_TRANSLATE) {
          const suggestionIdToSuggestion = {};
          for (let suggestionId in ctrl.contributions) {
            var contribution = ctrl.contributions[suggestionId];
            suggestionIdToSuggestion[suggestionId] = contribution.suggestion;
          }
          ContextService.setCustomEntityContext(
            IMAGE_CONTEXT.EXPLORATION_SUGGESTIONS, suggestion.target_id);
          _showTranslationSuggestionModal(
            suggestionIdToSuggestion, suggestionId, reviewable);
        }
      };

      var getContributionSummaries = function(suggestionIdToSuggestions) {
        if (ctrl.activeSuggestionType === SUGGESTION_TYPE_TRANSLATE) {
          return getTranslationContributionsSummary(suggestionIdToSuggestions);
        } else if (ctrl.activeSuggestionType === SUGGESTION_TYPE_QUESTION) {
          return getQuestionContributionsSummary(suggestionIdToSuggestions);
        }
      };

      ctrl.switchToTab = function(tabType, suggestionType) {
        ctrl.activeSuggestionType = suggestionType;
        ctrl.activeTabType = tabType;
        ctrl.contributions = {};
        ContributionOpportunitiesService.reloadOpportunitiesEventEmitter.emit();
      };

      ctrl.loadContributions = function() {
        if (!ctrl.activeTabType || !ctrl.activeSuggestionType) {
          return new Promise((resolve, reject) => {
            resolve({opportunitiesDicts: [], more: false});
          });
        }
        var fetchFunction = tabNameToOpportunityFetchFunction[
          ctrl.activeSuggestionType][ctrl.activeTabType];

        return fetchFunction().then(function(suggestionIdToSuggestions) {
          ctrl.contributions = suggestionIdToSuggestions;
          return {
            opportunitiesDicts: getContributionSummaries(ctrl.contributions),
            more: false
          };
        });
      };

      ctrl.$onInit = function() {
        ctrl.contributions = [];
        ctrl.userDetailsLoading = true;
        ctrl.userIsLoggedIn = false;
        ctrl.activeTabType = '';
        ctrl.activeSuggestionType = '';
        ctrl.reviewTabs = [];
        ctrl.contributionTabs = [
          {
            suggestionType: SUGGESTION_TYPE_QUESTION,
            text: 'Questions'
          },
          {
            suggestionType: SUGGESTION_TYPE_TRANSLATE,
            text: 'Translations'
          }
        ];

        UserService.getUserInfoAsync().then(function(userInfo) {
          ctrl.userIsLoggedIn = userInfo.isLoggedIn();
          ctrl.userDetailsLoading = false;
          if (ctrl.userIsLoggedIn) {
            UserService.getUserContributionRightsDataAsync().then(
              function(userContributionRights) {
                var userCanReviewTranslationSuggestionsInLanguages = (
                  userContributionRights
                    .can_review_translation_for_language_codes);
                var userCanReviewQuestionSuggestions = (
                  userContributionRights.can_review_questions);
                if (userCanReviewQuestionSuggestions) {
                  ctrl.reviewTabs.push({
                    suggestionType: SUGGESTION_TYPE_QUESTION,
                    text: 'Review Questions'
                  });
                }
                if (
                  userCanReviewTranslationSuggestionsInLanguages
                    .length > 0) {
                  ctrl.reviewTabs.push({
                    suggestionType: SUGGESTION_TYPE_TRANSLATE,
                    text: 'Review Translations'
                  });
                }
                if (ctrl.reviewTabs.length > 0) {
                  ctrl.switchToTab(
                    ctrl.TAB_TYPE_REVIEWS, ctrl.reviewTabs[0].suggestionType);
                } else {
                  ctrl.switchToTab(
                    ctrl.TAB_TYPE_CONTRIBUTIONS, SUGGESTION_TYPE_QUESTION);
                }
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the controller is migrated to angular.
                $rootScope.$applyAsync();
              });
          }
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        });
      };
    }
  ]
});
