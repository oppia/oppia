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
        '$scope', '$filter', '$timeout', '$rootScope', 'EditorStateService',
        'ExplorationStatesService', 'ExplorationInitStateNameService',
        function(
            $scope, $filter, $timeout, $rootScope, EditorStateService,
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

          $scope.isActive = function(tabId) {
            return ($scope.activatedTabId === tabId);
          };

          $scope.onTabClick = function(tabId) {
            $scope.activatedTabId = tabId;
            $scope.activeHintIndex = null;
            $scope.activeAnswerGroupIndex = null;
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
            // If the current hint is being clicked on again, close it.
            if (newIndex === $scope.activeHintIndex) {
              $scope.activeHintIndex = null;
            } else {
              $scope.activeHintIndex = newIndex;
            }
          };

          $scope.changeActiveAnswerGroupIndex = function(newIndex) {
            // If the current answer group is being clicked on again, close it.
            if (newIndex === $scope.activeAnswerGroupIndex) {
              $scope.activeAnswerGroupIndex = null;
            } else {
              $scope.activeAnswerGroupIndex = newIndex;
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
            $scope.activatedTabId = $scope.TAB_ID_CONTENT;

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
            $rootScope.loadingMessage = '';
          };

          // TODO(DubeySandeep): We need to call initStateTranslation() here in
          // case the listener that receives 'refreshStateTranslation' is not
          // set by the time it is broadcasted from ExplorationEditor.js. Figure
          // out a solution that does not rely on covering the race condition.
          if (ExplorationStatesService.isInitialized()) {
            $scope.initStateTranslation();
          }
        }
      ]
    };
  }]);
