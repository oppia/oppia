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

oppia.directive('unresolvedAnswersOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'unresolved_answers_overview_directive.html'),
      controller: [
        '$rootScope', '$scope', 'EditorStateService',
        'StateTopAnswersStatsService',
        function(
            $rootScope, $scope, EditorStateService,
            StateTopAnswersStatsService) {
          $scope.stateStats = [];
          $scope.unresolvedAnswersOverviewIsShown = false;

          $rootScope.$on('stateStatsUpdate', function() {
            $scope.unresolvedAnswersOverviewIsShown =
              StateTopAnswersStatsService.isInitialized();
            $scope.stateStats = StateTopAnswersStatsService.getStateStats(
              EditorStateService.getActiveStateName()
            ).filter(
              function(answerStats) { return !answerStats.isAddressed; }
            );
          });
        }
      ]
    };
  }]);
