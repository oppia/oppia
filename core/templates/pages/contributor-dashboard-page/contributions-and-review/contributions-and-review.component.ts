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
    'ContributionAndReviewService',
    'QuestionObjectFactory', 'SkillBackendApiService',
    'UrlInterpolationService', 'UserService', 'IMAGE_CONTEXT',
    function(
        $filter, $rootScope, $uibModal, AlertsService, ContextService,
        ContributionAndReviewService,
        QuestionObjectFactory, SkillBackendApiService,
        UrlInterpolationService, UserService, IMAGE_CONTEXT) {
      var ctrl = this;
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
            ContributionAndReviewService.getUserCreatedQuestionSuggestions),
          [ctrl.TAB_TYPE_REVIEWS]: (
            ContributionAndReviewService.getReviewableQuestionSuggestions)
        },
        [SUGGESTION_TYPE_TRANSLATE]: {
          [ctrl.TAB_TYPE_CONTRIBUTIONS]: (
            ContributionAndReviewService.getUserCreatedTranslationSuggestions),
          [ctrl.TAB_TYPE_REVIEWS]: (
            ContributionAndReviewService.getReviewableTranslationSuggestions)
        }
      };

      var getQuestionContributionsSummary = function() {
        var questionContributionsSummaryList = [];
        Object.keys(ctrl.contributions).forEach(function(key) {
          var suggestion = ctrl.contributions[key].suggestion;
          var details = ctrl.contributions[key].details;
          var change = suggestion.change;
          var requiredData = {
            id: suggestion.suggestion_id,
            heading: $filter('formatRtePreview')(
              change.question_dict.question_state_data.content.html),
            subheading: details.skill_description,
            labelText: SUGGESTION_LABELS[suggestion.status].text,
            labelColor: SUGGESTION_LABELS[suggestion.status].color,
            actionButtonTitle: (
              ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS ? 'Review' : 'View')
          };
          questionContributionsSummaryList.push(requiredData);
        });
        return questionContributionsSummaryList;
      };

      var getTranslationContributionsSummary = function() {
        var translationContributionsSummaryList = [];
        Object.keys(ctrl.contributions).forEach(function(key) {
          var suggestion = ctrl.contributions[key].suggestion;
          var details = ctrl.contributions[key].details;
          var change = suggestion.change;
          var requiredData = {
            id: suggestion.suggestion_id,
            heading: $filter('formatRtePreview')(change.translation_html),
            subheading: (
              details.topic_name + ' / ' + details.story_title +
              ' / ' + details.chapter_title),
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
        ctrl.contributionSummaries = (
          ctrl.contributionSummaries.filter(function(suggestion) {
            return suggestion.id !== suggestionId;
          }));
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
          targetId, suggestionId, contentHtml, translationHtml,
          reviewable) {
        var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/contributor-dashboard-page/modal-templates/' +
          'translation-suggestion-review.directive.html');

        $uibModal.open({
          templateUrl: _templateUrl,
          backdrop: true,
          size: 'lg',
          resolve: {
            translationHtml: function() {
              return translationHtml;
            },
            contentHtml: function() {
              return contentHtml;
            },
            reviewable: function() {
              return reviewable;
            }
          },
          controller: 'TranslationSuggestionReviewModalController'
        }).result.then(function(result) {
          ContributionAndReviewService.resolveSuggestionToExploration(
            targetId, suggestionId, result.action, result.reviewMessage,
            result.commitMessage, resolveSuggestionSuccess);
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

      ctrl.onLoadMoreContributions = function() {
        if (ctrl.contributionsDataLoading || !ctrl.moreOpportunitiesAvailable) {
          return;
        }
        ctrl.contributionsDataLoading = true;

        var fetchFunction = tabNameToOpportunityFetchFunction[
          ctrl.activeSuggestionType][ctrl.activeTabType];
        fetchFunction(function(suggestionIdToSuggestions, more) {
          ctrl.contributions = Object.assign(
            ctrl.contributions, suggestionIdToSuggestions);
          ctrl.moreOpportunitiesAvailable = more;
          updateContributionSummaries();
          ctrl.contributionsDataLoading = false;
        });
      };

      ctrl.onClickViewSuggestion = function(suggestionId) {
        var suggestion = ctrl.contributions[suggestionId].suggestion;
        var reviewable = ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS;
        if (suggestion.suggestion_type === SUGGESTION_TYPE_QUESTION) {
          var contributionDetails = (
            ctrl.contributions[suggestionId].details);
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
          ContextService.setCustomEntityContext(
            IMAGE_CONTEXT.EXPLORATION_SUGGESTIONS, suggestion.target_id);
          _showTranslationSuggestionModal(
            suggestion.target_id, suggestion.suggestion_id,
            suggestion.change.content_html,
            suggestion.change.translation_html, reviewable);
        }
      };

      var updateContributionSummaries = function() {
        if (ctrl.activeSuggestionType === SUGGESTION_TYPE_TRANSLATE) {
          ctrl.contributionSummaries = getTranslationContributionsSummary();
        } else if (ctrl.activeSuggestionType === SUGGESTION_TYPE_QUESTION) {
          ctrl.contributionSummaries = getQuestionContributionsSummary();
        }
      };

      ctrl.switchToTab = function(tabType, suggestionType) {
        var fetchFunction = tabNameToOpportunityFetchFunction[
          suggestionType][tabType];

        ctrl.activeTabType = tabType;
        ctrl.activeSuggestionType = suggestionType;
        ctrl.contributionsDataLoading = true;
        ctrl.contributions = {};
        updateContributionSummaries();
        ContributionAndReviewService.resetCursor();
        fetchFunction(function(suggestionIdToSuggestions, more) {
          ctrl.contributions = suggestionIdToSuggestions;
          ctrl.moreOpportunitiesAvailable = more;
          updateContributionSummaries();
          ctrl.contributionsDataLoading = false;
        });
      };

      ctrl.$onInit = function() {
        ctrl.userDetailsLoading = true;
        ctrl.userIsLoggedIn = false;
        ctrl.contributions = {};
        ctrl.contributionSummaries = [];
        ctrl.contributionsDataLoading = true;
        ctrl.activeTabType = '';
        ctrl.activeSuggestionType = '';
        ctrl.reviewTabs = [];
        ctrl.moreOpportunitiesAvailable = true;
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
            UserService.getUserContributionRightsData().then(
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
              });
          }
        });
      };
    }
  ]
});
