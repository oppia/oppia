// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the outcome destination editor.
 */

require('components/graph-services/graph-layout.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/editability.service.ts');
require('services/user.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('outcomeDestinationEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        outcomeHasFeedback: '=',
        outcome: '=',
        addState: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/outcome-editor/' +
        'outcome-destination-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'EditorFirstTimeEventsService', 'FocusManagerService',
        'StateEditorService', 'StateGraphLayoutService', 'UserService',
        'ENABLE_PREREQUISITE_SKILLS', 'EXPLORATION_AND_SKILL_ID_PATTERN',
        'PLACEHOLDER_OUTCOME_DEST',
        function(
            $scope, EditorFirstTimeEventsService, FocusManagerService,
            StateEditorService, StateGraphLayoutService, UserService,
            ENABLE_PREREQUISITE_SKILLS, EXPLORATION_AND_SKILL_ID_PATTERN,
            PLACEHOLDER_OUTCOME_DEST) {
          var ctrl = this;
          var currentStateName = null;
          ctrl.canAddPrerequisiteSkill = (
            ENABLE_PREREQUISITE_SKILLS &&
            StateEditorService.isExplorationWhitelisted());

          $scope.$on('saveOutcomeDestDetails', function() {
            if (ctrl.isSelfLoop()) {
              ctrl.outcome.dest = StateEditorService.getActiveStateName();
            }
            // Create new state if specified.
            if (ctrl.outcome.dest === PLACEHOLDER_OUTCOME_DEST) {
              EditorFirstTimeEventsService
                .registerFirstCreateSecondStateEvent();

              var newStateName = ctrl.outcome.newStateName;
              ctrl.outcome.dest = newStateName;
              delete ctrl.outcome.newStateName;

              ctrl.addState(newStateName);
            }
          });

          ctrl.canEditRefresherExplorationId = null;
          UserService.getUserInfoAsync().then(function(userInfo) {
            // We restrict editing of refresher exploration IDs to
            // admins/moderators for now, since the feature is still in
            // development.
            ctrl.canEditRefresherExplorationId = (
              userInfo.isAdmin() || userInfo.isModerator());
          });

          ctrl.explorationAndSkillIdPattern =
            EXPLORATION_AND_SKILL_ID_PATTERN;

          ctrl.isSelfLoop = function() {
            return ctrl.outcome.dest === currentStateName;
          };

          ctrl.onDestSelectorChange = function() {
            if (ctrl.outcome.dest === PLACEHOLDER_OUTCOME_DEST) {
              FocusManagerService.setFocus('newStateNameInputField');
            }
          };

          ctrl.isCreatingNewState = function(outcome) {
            return outcome.dest === PLACEHOLDER_OUTCOME_DEST;
          };

          ctrl.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
          ctrl.destChoices = [];
          $scope.$watch(StateEditorService.getStateNames, function() {
            currentStateName = StateEditorService.getActiveStateName();

            var questionModeEnabled = StateEditorService.isInQuestionMode();
            // This is a list of objects, each with an ID and name. These
            // represent all states, as well as an option to create a
            // new state.
            ctrl.destChoices = [{
              id: (questionModeEnabled ? null : currentStateName),
              text: '(try again)'
            }];

            // Arrange the remaining states based on their order in the state
            // graph.
            var lastComputedArrangement = (
              StateGraphLayoutService.getLastComputedArrangement());
            var allStateNames = StateEditorService.getStateNames();

            // It is possible that lastComputedArrangement is null if the graph
            // has never been rendered at the time this computation is being
            // carried out.
            var stateNames = angular.copy(allStateNames);
            var stateName = null;
            if (lastComputedArrangement) {
              var maxDepth = 0;
              var maxOffset = 0;
              for (stateName in lastComputedArrangement) {
                maxDepth = Math.max(
                  maxDepth, lastComputedArrangement[stateName].depth);
                maxOffset = Math.max(
                  maxOffset, lastComputedArrangement[stateName].offset);
              }

              // Higher scores come later.
              var allStateScores = {};
              var unarrangedStateCount = 0;
              for (var i = 0; i < allStateNames.length; i++) {
                stateName = allStateNames[i];
                if (lastComputedArrangement.hasOwnProperty(stateName)) {
                  allStateScores[stateName] = (
                    lastComputedArrangement[stateName].depth * (maxOffset + 1) +
                    lastComputedArrangement[stateName].offset);
                } else {
                  // States that have just been added in the rule 'create new'
                  // modal are not yet included as part of
                  // lastComputedArrangement so we account for them here.
                  allStateScores[stateName] = (
                    (maxDepth + 1) * (maxOffset + 1) + unarrangedStateCount);
                  unarrangedStateCount++;
                }
              }

              stateNames = allStateNames.sort(function(a, b) {
                return allStateScores[a] - allStateScores[b];
              });
            }

            for (var i = 0; i < stateNames.length; i++) {
              if (stateNames[i] !== currentStateName) {
                ctrl.destChoices.push({
                  id: stateNames[i],
                  text: stateNames[i]
                });
              }
            }

            if (!questionModeEnabled) {
              ctrl.destChoices.push({
                id: PLACEHOLDER_OUTCOME_DEST,
                text: 'A New Card Called...'
              });
            }
          }, true);
        }
      ]
    };
  }]);
