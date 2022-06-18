// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the skill preview tab.
 */

require(
  'pages/exploration-player-page/learner-experience/' +
    'conversation-skin.component.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require('pages/review-test-page/review-test-engine.service.ts');
require(
  'pages/exploration-player-page/learner-experience/tutor-card.component.ts');
require(
  'components/question-directives/question-player/' +
    'question-player.component.ts');
require('pages/review-test-page/review-test-page.constants.ajs.ts');
require('pages/review-test-page/review-test-engine.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require(
  'pages/exploration-player-page/services/question-player-engine.service.ts');
require('services/contextual/url.service.ts');
require('services/context.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
    'topics-and-skills-dashboard-backend-api.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('skillPreviewTab', {
  template: require('./skill-preview-tab.component.html'),
  controllerAs: '$ctrl',
  controller: [
    '$rootScope', '$scope', 'ContextService', 'CurrentInteractionService',
    'ExplorationPlayerStateService',
    'QuestionBackendApiService', 'QuestionObjectFactory',
    'QuestionPlayerEngineService', 'SkillEditorStateService', 'UrlService',
    function(
        $rootScope, $scope, ContextService, CurrentInteractionService,
        ExplorationPlayerStateService,
        QuestionBackendApiService, QuestionObjectFactory,
        QuestionPlayerEngineService, SkillEditorStateService, UrlService) {
      var ctrl = this;
      var QUESTION_COUNT = 20;
      const INTERACTION_TYPES = {
        ALL: 'All',
        TEXT_INPUT: 'Text Input',
        MULTIPLE_CHOICE: 'Multiple Choice',
        NUMERIC_INPUT: 'Numeric Input',
        ITEM_SELECTION: 'Item Selection'
      };
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.$onInit = function() {
        ctrl.skillId = UrlService.getSkillIdFromUrl();
        SkillEditorStateService.loadSkill(ctrl.skillId);
        ctrl.questionTextFilter = '';
        ctrl.interactionFilter = INTERACTION_TYPES.ALL;
        ctrl.displayCardIsInitialized = false;
        ctrl.questionsFetched = false;
        ctrl.ALLOWED_QUESTION_INTERACTIONS = [];
        for (let interaction in INTERACTION_TYPES) {
          ctrl.ALLOWED_QUESTION_INTERACTIONS.push(
            INTERACTION_TYPES[interaction]);
        }
        ctrl.skill = SkillEditorStateService.getSkill();
        ctrl.htmlData = (
          ctrl.skill ?
          ctrl.skill.getConceptCard().getExplanation().html :
          'loading review material'
        );

        QuestionBackendApiService.fetchQuestionsAsync(
          [ctrl.skillId], QUESTION_COUNT, false).then((response) => {
          ctrl.questionsFetched = true;
          ctrl.questionDicts = response;
          ctrl.displayedQuestions = response;
          if (ctrl.questionDicts.length) {
            ctrl.selectQuestionToPreview(0);
          }
        });
        ctrl.directiveSubscriptions.add(
          SkillEditorStateService.onSkillChange.subscribe(
            () => $rootScope.$applyAsync()));
        CurrentInteractionService.setOnSubmitFn(() => {
          ExplorationPlayerStateService.onOppiaFeedbackAvailable.emit();
        });
      };

      ctrl.initializeQuestionCard = function(card) {
        ctrl.displayCardIsInitialized = true;
        ctrl.displayedCard = card;
        $scope.$applyAsync();
      };

      ctrl.applyFilters = function() {
        ctrl.displayedQuestions = ctrl.questionDicts.filter(
          questionDict => {
            var contentData = questionDict.question_state_data.content.html;
            var interactionType = (
              questionDict.question_state_data.interaction.id);
            var htmlContentIsMatching = Boolean(
              contentData.toLowerCase().includes(
                ctrl.questionTextFilter.toLowerCase()));
            if (ctrl.interactionFilter === INTERACTION_TYPES.ALL) {
              return htmlContentIsMatching;
            } else if (
              ctrl.interactionFilter === INTERACTION_TYPES.TEXT_INPUT &&
                  interactionType !== 'TextInput') {
              return false;
            } else if (
              ctrl.interactionFilter === INTERACTION_TYPES.MULTIPLE_CHOICE &&
                  interactionType !== 'MultipleChoiceInput') {
              return false;
            } else if (
              ctrl.interactionFilter === INTERACTION_TYPES.ITEM_SELECTION &&
                  interactionType !== 'ItemSelectionInput') {
              return false;
            } else if (
              ctrl.interactionFilter === INTERACTION_TYPES.NUMERIC_INPUT &&
                  interactionType !== 'NumericInput') {
              return false;
            }
            return htmlContentIsMatching;
          });
      };

      ctrl.selectQuestionToPreview = function(index) {
        QuestionPlayerEngineService.clearQuestions();
        ctrl.displayCardIsInitialized = false;
        QuestionPlayerEngineService.init(
          [
            QuestionObjectFactory.createFromBackendDict(
              ctrl.displayedQuestions[index]
            )
          ],
          ctrl.initializeQuestionCard
        );
      };

      $scope.$on('$destroy', function() {
        ContextService.clearQuestionPlayerIsOpen();
      });
    }]
});
