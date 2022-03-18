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

import cloneDeep from 'lodash/cloneDeep';
import { TranslationSuggestionReviewModalComponent } from '../modal-templates/translation-suggestion-review-modal.component';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

require('base-components/base-content.component.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.component.ts');
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
  'pages/contributor-dashboard-page/services/' +
  'contribution-and-review.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/suggestion-modal.service.ts');
require('services/ngb-modal.service.ts');

require(
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/contributor-dashboard-page.constants.ajs.ts');

angular.module('oppia').component('contributionsAndReview', {
  template: require('./contributions-and-review.component.html'),
  controller: [
    '$filter', '$rootScope', '$uibModal', 'AlertsService', 'ContextService',
    'ContributionAndReviewService', 'ContributionOpportunitiesService',
    'NgbModal', 'QuestionObjectFactory',
    'SkillBackendApiService', 'TranslationTopicService',
    'UrlInterpolationService', 'UserService',
    'CORRESPONDING_DELETED_OPPORTUNITY_TEXT',
    'DEFAULT_OPPORTUNITY_TOPIC_NAME', 'IMAGE_CONTEXT',
    function(
        $filter, $rootScope, $uibModal, AlertsService, ContextService,
        ContributionAndReviewService, ContributionOpportunitiesService,
        NgbModal, QuestionObjectFactory,
        SkillBackendApiService, TranslationTopicService,
        UrlInterpolationService, UserService,
        CORRESPONDING_DELETED_OPPORTUNITY_TEXT,
        DEFAULT_OPPORTUNITY_TOPIC_NAME, IMAGE_CONTEXT) {
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
          text: 'Revisions Requested',
          color: '#e76c8c'
        }
      };
      var SUGGESTION_TYPE_QUESTION = 'add_question';
      var SUGGESTION_TYPE_TRANSLATE = 'translate_content';
      ctrl.TAB_TYPE_CONTRIBUTIONS = 'contributions';
      ctrl.TAB_TYPE_REVIEWS = 'reviews';

      var tabNameToOpportunityFetchFunction = {
        [SUGGESTION_TYPE_QUESTION]: {
          [ctrl.TAB_TYPE_CONTRIBUTIONS]: shouldResetOffset => {
            return ContributionAndReviewService
              .getUserCreatedQuestionSuggestionsAsync(
                shouldResetOffset,
                TranslationTopicService.getActiveTopicName());
          },
          [ctrl.TAB_TYPE_REVIEWS]: shouldResetOffset => {
            return ContributionAndReviewService
              .getReviewableQuestionSuggestionsAsync(
                shouldResetOffset,
                TranslationTopicService.getActiveTopicName());
          }
        },
        [SUGGESTION_TYPE_TRANSLATE]: {
          [ctrl.TAB_TYPE_CONTRIBUTIONS]: shouldResetOffset => {
            return ContributionAndReviewService
              .getUserCreatedTranslationSuggestionsAsync(
                shouldResetOffset,
                TranslationTopicService.getActiveTopicName());
          },
          [ctrl.TAB_TYPE_REVIEWS]: shouldResetOffset => {
            return ContributionAndReviewService
              .getReviewableTranslationSuggestionsAsync(
                shouldResetOffset,
                TranslationTopicService.getActiveTopicName());
          }
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
            subheading = CORRESPONDING_DELETED_OPPORTUNITY_TEXT;
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
            subheading = CORRESPONDING_DELETED_OPPORTUNITY_TEXT;
          } else {
            subheading = (
              details.topic_name + ' / ' + details.story_title +
              ' / ' + details.chapter_title);
          }

          var requiredData = {
            id: suggestion.suggestion_id,
            heading: getTranslationSuggestionHeading(suggestion),
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

      var getTranslationSuggestionHeading = function(suggestion) {
        const changeTranslation = suggestion.change.translation_html;
        if (Array.isArray(changeTranslation)) {
          return $filter('formatRtePreview')(changeTranslation.join(', '));
        }
        return $filter('formatRtePreview')(changeTranslation);
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
        var contentHtml = question.getStateData().content.html;
        var skillRubrics = contributionDetails.skill_rubrics;
        var skillDifficulty = suggestion.change.skill_difficulty;

        $uibModal.open({
          templateUrl: _templateUrl,
          backdrop: 'static',
          size: 'lg',
          resolve: {
            suggestion: function() {
              return cloneDeep(suggestion);
            },
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
            },
            suggestionId: function() {
              return suggestionId;
            }
          },
          controller: 'QuestionSuggestionReviewModalController'
        }).result.then(function(result) {
          ContributionAndReviewService.reviewSkillSuggestion(
            targetId, suggestionId, result.action, result.reviewMessage,
            result.skillDifficulty, resolveSuggestionSuccess, () => {
              AlertsService.addInfoMessage('Failed to submit suggestion.');
            });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
          $rootScope.$applyAsync();
        });
      };

      var _showTranslationSuggestionModal = function(
          suggestionIdToContribution, initialSuggestionId, reviewable) {
        var details = ctrl.contributions[initialSuggestionId].details;
        var subheading = (
          details.topic_name + ' / ' + details.story_title +
          ' / ' + details.chapter_title);
        const modalRef: NgbModalRef = NgbModal.open(
          TranslationSuggestionReviewModalComponent, {
            backdrop: 'static',
            windowClass: 'oppia-translation-suggestion-review-modal',
            size: 'lg',
          });
        modalRef.componentInstance.suggestionIdToContribution = (
          cloneDeep(suggestionIdToContribution));
        modalRef.componentInstance.initialSuggestionId = initialSuggestionId;
        modalRef.componentInstance.reviewable = reviewable;
        modalRef.componentInstance.subheading = subheading;
        modalRef.result.then(function(resolvedSuggestionIds) {
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
          SkillBackendApiService.fetchSkillAsync(skillId).then((skillDict) => {
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
          const suggestionIdToContribution = {};
          for (let suggestionId in ctrl.contributions) {
            var contribution = ctrl.contributions[suggestionId];
            suggestionIdToContribution[suggestionId] = contribution;
          }
          ContextService.setCustomEntityContext(
            IMAGE_CONTEXT.EXPLORATION_SUGGESTIONS, suggestion.target_id);
          _showTranslationSuggestionModal(
            suggestionIdToContribution, suggestionId, reviewable);
        }
      };

      var getContributionSummaries = function(suggestionIdToSuggestions) {
        if (ctrl.activeSuggestionType === SUGGESTION_TYPE_TRANSLATE) {
          return getTranslationContributionsSummary(suggestionIdToSuggestions);
        } else if (ctrl.activeSuggestionType === SUGGESTION_TYPE_QUESTION) {
          return getQuestionContributionsSummary(suggestionIdToSuggestions);
        }
      };

      ctrl.getActiveDropdownTabChoice = function() {
        if (ctrl.activeTabType === ctrl.TAB_TYPE_REVIEWS) {
          if (ctrl.activeSuggestionType === SUGGESTION_TYPE_QUESTION) {
            return 'Review Questions';
          }
          return 'Review Translations';
        }
        if (ctrl.activeSuggestionType === SUGGESTION_TYPE_QUESTION) {
          return 'Questions';
        }
        return 'Translations';
      };

      ctrl.switchToTab = function(tabType, suggestionType) {
        ctrl.activeSuggestionType = suggestionType;
        ctrl.activeTabType = tabType;
        ContributionAndReviewService.setActiveTabType(tabType);
        ContributionAndReviewService.setActiveSuggestionType(suggestionType);
        ctrl.activeDropdownTabChoice = ctrl.getActiveDropdownTabChoice();
        ctrl.dropdownShown = false;
        ctrl.contributions = {};
        ContributionOpportunitiesService.reloadOpportunitiesEventEmitter.emit();
      };

      ctrl.toggleDropdown = function() {
        ctrl.dropdownShown = !ctrl.dropdownShown;
      };

      ctrl.loadOpportunities = function() {
        return ctrl.loadContributions(/* Param shouldResetOffset= */ true);
      };

      ctrl.loadMoreOpportunities = function() {
        return ctrl.loadContributions(/* Param shouldResetOffset= */ false);
      };

      ctrl.loadContributions = function(shouldResetOffset) {
        if (!ctrl.activeTabType || !ctrl.activeSuggestionType) {
          return new Promise((resolve, reject) => {
            resolve({opportunitiesDicts: [], more: false});
          });
        }
        const fetchFunction = tabNameToOpportunityFetchFunction[
          ctrl.activeSuggestionType][ctrl.activeTabType];

        return fetchFunction(shouldResetOffset).then(function(response) {
          Object.keys(response.suggestionIdToDetails).forEach(id => {
            ctrl.contributions[id] = response.suggestionIdToDetails[id];
          });
          return {
            opportunitiesDicts: getContributionSummaries(
              response.suggestionIdToDetails),
            more: response.more
          };
        });
      };

      ctrl.closeDropdownWhenClickedOutside = function(clickEvent) {
        const dropdown = document
          .querySelector('.oppia-contributions-dropdown-container');
        if (!dropdown) {
          return;
        }

        const clickOccurredWithinDropdown =
          dropdown.contains(clickEvent.target);
        if (clickOccurredWithinDropdown) {
          return;
        }

        ctrl.dropdownShown = false;
        $rootScope.$apply();
      };

      ctrl.$onInit = function() {
        ctrl.contributions = [];
        ctrl.userDetailsLoading = true;
        ctrl.userIsLoggedIn = false;
        ctrl.activeTabType = '';
        ctrl.activeSuggestionType = '';
        ctrl.dropdownShown = false;
        ctrl.activeDropdownTabChoice = '';
        ctrl.reviewTabs = [];
        ctrl.contributionTabs = [
          {
            suggestionType: SUGGESTION_TYPE_QUESTION,
            text: 'Questions',
            enabled: false
          },
          {
            suggestionType: SUGGESTION_TYPE_TRANSLATE,
            text: 'Translations',
            enabled: true
          }
        ];
        TranslationTopicService.setActiveTopicName(
          DEFAULT_OPPORTUNITY_TOPIC_NAME);

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
                var userReviewableSuggestionTypes = [];
                var userCanSuggestQuestions = (
                  userContributionRights.can_suggest_questions);
                for (var index in ctrl.contributionTabs) {
                  if (ctrl.contributionTabs[index].suggestionType === (
                    SUGGESTION_TYPE_QUESTION)) {
                    ctrl.contributionTabs[index].enabled = (
                      userCanSuggestQuestions);
                  }
                }
                if (userCanReviewQuestionSuggestions) {
                  ctrl.reviewTabs.push({
                    suggestionType: SUGGESTION_TYPE_QUESTION,
                    text: 'Review Questions'
                  });
                  userReviewableSuggestionTypes.push(SUGGESTION_TYPE_QUESTION);
                }
                if (
                  userCanReviewTranslationSuggestionsInLanguages
                    .length > 0) {
                  ctrl.reviewTabs.push({
                    suggestionType: SUGGESTION_TYPE_TRANSLATE,
                    text: 'Review Translations'
                  });
                  userReviewableSuggestionTypes.push(
                    SUGGESTION_TYPE_TRANSLATE);
                }
                if (userReviewableSuggestionTypes.length > 0) {
                  ctrl.switchToTab(
                    ctrl.TAB_TYPE_REVIEWS, userReviewableSuggestionTypes[0]);
                } else if (userCanSuggestQuestions) {
                  ctrl.switchToTab(
                    ctrl.TAB_TYPE_CONTRIBUTIONS, SUGGESTION_TYPE_QUESTION);
                } else {
                  ctrl.switchToTab(
                    ctrl.TAB_TYPE_CONTRIBUTIONS, SUGGESTION_TYPE_TRANSLATE);
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
        $(document).on('click', ctrl.closeDropdownWhenClickedOutside);
      };

      ctrl.$onDestroy = function() {
        $(document).off('click', ctrl.closeDropdownWhenClickedOutside);
      };
    }
  ]
});
