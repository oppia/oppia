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
 * @fileoverview Directive containing the exploration material to be translated.
 */

oppia.directive('stateTranslation', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_directive.html'),
      controller: [
        '$scope', '$filter', '$rootScope', 'EditorStateService',
        'ExplorationStatesService', 'ExplorationInitStateNameService',
        function(
            $scope, $filter, $rootScope, EditorStateService,
            ExplorationStatesService, ExplorationInitStateNameService) {
          // Define tab constants.
          $scope.TAB_ID_CONTENT = 'content';
          $scope.TAB_ID_FEEDBACK = 'feedback';
          $scope.TAB_ID_HINTS = 'hints';
          $scope.TAB_ID_SOLUTION = 'solution';
          $rootScope.loadingMessage = 'Loading';

          // Activates Content tab by default.
          $scope.activatedTabId = $scope.TAB_ID_CONTENT;

          $scope.activeHintIndex = null;
          $scope.activeAnswerGroupIndex = null;
          $scope.stateContent = null;
          $scope.stateInteractionId = null;
          $scope.stateAnswerGroups = [];
          $scope.stateDefaultOutcome = null;
          $scope.stateHints = [];
          $scope.stateSolution = null;
          $scope.activeContentId = null;

          $scope.isActive = function(tabId) {
            return ($scope.activatedTabId === tabId);
          };

          $scope.onTabClick = function(tabId) {
            $scope.ACTIVATED_TAB_ID = tabId;
            if (tabId === $scope.TAB_ID_CONTENT) {
              $scope.activeContentId = $scope.stateContent.getContentId();
            } else if (tabId === $scope.TAB_ID_FEEDBACK) {
              $scope.activeAnswerGroupIndex = 0;
              if ($scope.stateAnswerGroups.length > 0) {
                $scope.activeContentId = $scope.stateAnswerGroups[0]
                  .outcome.feedback.getContentId();
              } else {
                $scope.activeContentId = $scope.stateDefaultOutcome
                  .feedback.getContentId();
              }
            } else if (tabId === $scope.TAB_ID_HINTS) {
              $scope.activeHintIndex = 0;
              $scope.activeContentId = $scope.stateHints[0]
                .hintContent.getContentId();
            } else if (tabId === $scope.TAB_ID_SOLUTION) {
              $scope.activeContentId = $scope.stateSolution.explanation
                .getContentId();
            }
          };

          $scope.isDisabled = function(tabId) {
            if (tabId === $scope.TAB_ID_FEEDBACK) {
              if (!$scope.stateDefaultOutcome || !$scope.stateInteractionId) {
                return true;
              } else {
                return false;
              }
            } else if (tabId === $scope.TAB_ID_HINTS) {
              if ($scope.stateHints.length <= 0) {
                return true;
              } else {
                return false;
              }
            } else {
              if (!$scope.stateSolution) {
                return true;
              } else {
                return false;
              }
            }
          };

          $scope.changeActiveHintIndex = function(newIndex) {
            $scope.activeHintIndex = newIndex;
            $scope.activeContentId = $scope.stateHints[newIndex]
              .hintContent.getContentId();
          };

          $scope.changeActiveAnswerGroupIndex = function(newIndex) {
            $scope.activeAnswerGroupIndex = newIndex;
            if (newIndex === $scope.stateAnswerGroups.length) {
              $scope.activeContentId = $scope.stateDefaultOutcome
                .feedback.getContentId();
            } else {
              $scope.activeContentId = $scope.stateAnswerGroups[newIndex]
                .outcome.feedback.getContentId();
            }
          };

          $scope.getHtmlSummary = function(subtitledHtml) {
            var htmlAsPlainText = $filter(
              'formatRtePreview')(subtitledHtml.getHtml());
            return htmlAsPlainText;
          };

          $scope.$on('refreshStateTranslation', function() {
            $scope.initStateTranslation();
          });

          $scope.initStateTranslation = function() {
            if (!EditorStateService.getActiveStateName()) {
              EditorStateService.setActiveStateName(
                ExplorationInitStateNameService.displayed);
            }
            var stateName = EditorStateService.getActiveStateName();

            $scope.stateContent = ExplorationStatesService
              .getStateContentMemento(stateName);
            $scope.stateSolution = ExplorationStatesService
              .getSolutionMemento(stateName);
            $scope.stateHints = ExplorationStatesService
              .getHintsMemento(stateName);
            $scope.stateAnswerGroups = ExplorationStatesService
              .getInteractionAnswerGroupsMemento(stateName);
            $scope.stateDefaultOutcome = ExplorationStatesService
              .getInteractionDefaultOutcomeMemento(stateName);
            $scope.stateInteractionId = ExplorationStatesService
              .getInteractionIdMemento(stateName);
            $scope.activeHintIndex = null;
            $scope.activeAnswerGroupIndex = null;

            $scope.onTabClick($scope.TAB_ID_CONTENT);
          };

          if (ExplorationStatesService.isInitialized()) {
            $scope.initStateTranslation();
          }
        }
      ]
    };
  }]);
