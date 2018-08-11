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
        getMisconceptions: '&misconceptions',
        canEditQuestion: '&',
        questionStateData: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_editor/question_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', 'AlertsService', 'QuestionCreationService',
        'EditabilityService', 'EditableQuestionBackendApiService',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'StateContentService', 'StateContentIdsToAudioTranslationsService',
        'INTERACTION_SPECS', 'StateEditorService', 'ResponsesService',
        'SolutionValidityService',
        function(
            $scope, $rootScope, AlertsService, QuestionCreationService,
            EditabilityService, EditableQuestionBackendApiService,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            StateContentService, StateContentIdsToAudioTranslationsService,
            INTERACTION_SPECS, StateEditorService, ResponsesService,
            SolutionValidityService) {
          if ($scope.canEditQuestion()) {
            EditabilityService.markEditable();
          } else {
            EditabilityService.markNotEditable();
          }
          StateEditorService.setActiveStateName('question');
          StateEditorService.setMisconceptions($scope.getMisconceptions());
          $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');

          $scope.interactionIsShown = false;

          $scope.stateEditorInitialized = false;

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
            StateEditorService.setStateNames([]);
            StateEditorService.setCorrectnessFeedbackEnabled(true);
            StateEditorService.setInQuestionMode(true);
            SolutionValidityService.init(['question']);
            var stateData = $scope.questionStateData;
            stateData.interaction.defaultOutcome.setDestination(null);
            if (stateData) {
              $rootScope.$broadcast('stateEditorInitialized', stateData);

              if (stateData.content.getHtml() || stateData.interaction.id) {
                $scope.interactionIsShown = true;
              }

              $rootScope.loadingMessage = '';
            }
            $scope.stateEditorInitialized = true;
          };

          $scope.saveStateContent = function(displayedValue) {
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            $scope.questionStateData.content = angular.copy(displayedValue);
            $scope.interactionIsShown = true;
          };

          $scope.saveInteractionId = function(displayedValue) {
            StateEditorService.setInteractionId(angular.copy(displayedValue));
          };

          $scope.saveInteractionAnswerGroups = function(newAnswerGroups) {
            StateEditorService.setInteractionAnswerGroups(
              angular.copy(newAnswerGroups));
          };

          $scope.saveInteractionDefaultOutcome = function(newOutcome) {
            StateEditorService.setInteractionDefaultOutcome(
              angular.copy(newOutcome));
          };

          $scope.saveInteractionCustomizationArgs = function(displayedValue) {
            StateEditorService.setInteractionCustomizationArgs(
              angular.copy(displayedValue));
          };

          $scope.saveSolution = function(displayedValue) {
            StateEditorService.setInteractionSolution(
              angular.copy(displayedValue));
          };

          $scope.saveHints = function(displayedValue) {
            StateEditorService.setInteractionHints(
              angular.copy(displayedValue));
          };

          $scope.saveContentIdsToAudioTranslations = function(displayedValue) {
            $scope.questionStateData.contentIdsToAudioTranslations =
              angular.copy(displayedValue);
          };

          $scope.$on('stateEditorDirectiveInitialized', function(evt) {
            _init();
          });

          $scope.$on('onInteractionIdChanged', function(evt) {
            _init();
          });

          _init();
        }
      ]
    };
  }]);
