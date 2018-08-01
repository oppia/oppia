// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the questions editor directive.
 */
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.constant('EVENT_PROGRESS_NAV_SUBMITTED', 'progress-nav-submit');

oppia.directive('questionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId',
        getQuestionStateData: '&questionStateData'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_editor/question_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', 'AlertsService', 'QuestionCreationService',
        'EditabilityService', 'EditableQuestionBackendApiService',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'StateContentService', 'StateContentIdsToAudioTranslationsService',
        'INTERACTION_SPECS', 'EditorStateService', 'ResponsesService',
        'SolutionValidityService',
        function(
            $scope, $rootScope, AlertsService, QuestionCreationService,
            EditabilityService, EditableQuestionBackendApiService,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            StateContentService, StateContentIdsToAudioTranslationsService,
            INTERACTION_SPECS, EditorStateService, ResponsesService,
            SolutionValidityService) {
          EditabilityService.markEditable();
          EditorStateService.setActiveStateName('question');
          $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');

          $scope.interactionIsShown = false;

          $scope.getStateContentPlaceholder = function() {
            return (
              'You can speak to the learner here, then ask them a question.');
          };

          $scope.navigateToState = function() {
            return;
          };

          $scope.addState = function() {
            return;
          };

          $scope.recomputeGraph = function() {
            return;
          };

          $scope.refreshWarnings = function() {
            return;
          };

          var _init = function() {
            EditorStateService.setStateNames([]);
            EditorStateService.setCorrectnessFeedbackEnabled(true);
            EditorStateService.setInQuestionMode(true);
            SolutionValidityService.init(['question']);
            var stateData = $scope.getQuestionStateData();
            if (stateData) {
              ResponsesService.save(
                [], stateData.interaction.defaultOutcome,
                function(newAnswerGroups, newDefaultOutcome) {}
              );
              $rootScope.$broadcast('stateEditorInitialized', stateData);

              if (stateData.content.getHtml() || stateData.interaction.id) {
                $scope.interactionIsShown = true;
              }

              $rootScope.loadingMessage = '';
            }
          };

          $scope.saveStateContent = function(displayedValue) {
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            $scope.interactionIsShown = true;
          };

          $scope.saveInteractionId = function(displayedValue) {
            EditorStateService.setInteractionId(angular.copy(displayedValue));
          };

          $scope.saveInteractionAnswerGroups = function(newAnswerGroups) {
            EditorStateService.setInteractionAnswerGroups(
              angular.copy(newAnswerGroups));
            $scope.recomputeGraph();
          };

          $scope.saveInteractionDefaultOutcome = function(newOutcome) {
            EditorStateService.setInteractionDefaultOutcome(
              angular.copy(newOutcome));
            $scope.recomputeGraph();
          };

          $scope.saveInteractionCustomizationArgs = function(displayedValue) {
            EditorStateService.setInteractionCustomizationArgs(
              angular.copy(displayedValue));
          };

          $scope.saveSolution = function(displayedValue) {
            EditorStateService.setInteractionSolution(
              angular.copy(displayedValue));
          };

          $scope.saveHints = function(displayedValue) {
            EditorStateService.setInteractionHints(
              angular.copy(displayedValue));
          };

          $scope.saveContentIdsToAudioTranslations = function(displayedValue) {
          };

          $scope.$on('stateEditorDirectiveInitialized', function(evt) {
            _init();
          });
        }
      ]
    };
  }]);
