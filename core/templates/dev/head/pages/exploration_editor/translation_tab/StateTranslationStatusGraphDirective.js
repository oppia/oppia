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
 * @fileoverview Directive for the state translation status graph.
 */

oppia.directive('stateTranslationStatusGraph', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isTranslationTabBusy: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_status_graph_directive.html'),
      controller: [
        '$scope', '$rootScope', 'ExplorationStatesService', 'GraphDataService',
        'StateEditorService', 'StateContentIdsToAudioTranslationsService',
        function(
            $scope, $rootScope, ExplorationStatesService, GraphDataService,
            StateEditorService, StateContentIdsToAudioTranslationsService) {
          $scope.getGraphData = GraphDataService.getGraphData;
          $scope.getActiveStateName = function() {
            return StateEditorService.getActiveStateName();
          };
          $scope.onClickStateInMap = function(newStateName) {
            if ($scope.isTranslationTabBusy) {
              $rootScope.$broadcast('showTranslationTabBusyModal');
              return;
            }
            StateEditorService.setActiveStateName(newStateName);
            var stateName = StateEditorService.getActiveStateName();
            var stateData = ExplorationStatesService.getState(stateName);
            if (stateName && stateData) {
              StateContentIdsToAudioTranslationsService.init(
                StateEditorService.getActiveStateName(),
                stateData.contentIdsToAudioTranslations);
              $rootScope.$broadcast('refreshStateTranslation');
              $rootScope.$broadcast('refreshAudioTranslationBar');
            }
          };
        }
      ]
    };
  }]);
