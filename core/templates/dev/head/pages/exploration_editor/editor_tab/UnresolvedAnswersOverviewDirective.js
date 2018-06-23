// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state graph visualization.
 */

// TODO(brianrodri): Add all other interaction IDs to this list, then remove
// the list altogether.
oppia.constant('SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS', ['TextInput']);

oppia.directive('unresolvedAnswersOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'unresolved_answers_overview_directive.html'),
      controller: [
        '$scope', 'EditorStateService', 'ExplorationStatesService',
        'StateTopAnswersStatsService',
        'SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS',
        function(
            $scope, EditorStateService, ExplorationStatesService,
            StateTopAnswersStatsService,
            SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS) {
          /**
           * @returns {boolean} - answers from this state can be rendered with
           * HTML.
           */
          var isStateInteractionIdHtmlRenderable = function() {
            var state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName());
            return (!!state &&
              SUPPORTED_HTML_RENDERINGS_FOR_INTERACTION_IDS.indexOf(
                state.interaction.id) !== -1);
          };

          $scope.isUnresolvedAnswersOverviewShown = function() {
            return (
              StateTopAnswersStatsService.hasStateStats(
                EditorStateService.getActiveStateName()) &&
              isStateInteractionIdHtmlRenderable());
          };

          $scope.getUnresolvedStateStats = function() {
            return StateTopAnswersStatsService.getUnresolvedStateStats(
              EditorStateService.getActiveStateName());
          };
        }
      ]
    };
  }]);
