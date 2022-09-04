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
 * @fileoverview Controller for state stats modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('visualizations/oppia-visualization-click-hexbins.directive.ts');
require(
  'visualizations/oppia-visualization-enumerated-frequency-table.directive.ts');
require('visualizations/oppia-visualization-frequency-table.directive.ts');
// require('visualizations/oppia-visualization-sorted-tiles.component.ts');

require('pages/exploration-editor-page/services/router.service.ts');

angular.module('oppia').controller('StateStatsModalController', [
  '$controller', '$scope', '$uibModalInstance', 'RouterService',
  'interactionArgs', 'stateName', 'stateStats', 'visualizationsInfo',
  function(
      $controller, $scope, $uibModalInstance, RouterService,
      interactionArgs, stateName, stateStats, visualizationsInfo) {
    $controller('ConfirmOrCancelModalController', {$scope, $uibModalInstance});

    const numTimesSolutionViewed = stateStats.numTimesSolutionViewed;
    const totalAnswersCount = stateStats.totalAnswersCount;
    const usefulFeedbackCount = stateStats.usefulFeedbackCount;
    const makeCompletionRatePieChartOptions = (title: string) => ({
      left: 20,
      pieHole: 0.6,
      pieSliceTextStyleColor: 'black',
      pieSliceBorderColor: 'black',
      chartAreaWidth: 240,
      colors: ['#d8d8d8', '#008808', 'blue'],
      height: 270,
      legendPosition: 'right',
      title: title,
      width: 240
    });

    $scope.hasExplorationBeenAnswered = totalAnswersCount > 0;
    $scope.interactionArgs = interactionArgs;
    $scope.numEnters = stateStats.totalHitCount;
    $scope.numQuits = stateStats.totalHitCount - stateStats.numCompletions;
    $scope.stateName = stateName;
    $scope.visualizationsInfo = visualizationsInfo;

    $scope.answerFeedbackPieChartData = [
      ['Type', 'Number'],
      ['Default feedback', totalAnswersCount - usefulFeedbackCount],
      ['Specific feedback', usefulFeedbackCount],
    ];
    $scope.answerFeedbackPieChartOptions = (
      makeCompletionRatePieChartOptions('Answer feedback statistics'));

    $scope.solutionUsagePieChartData = [
      ['Type', 'Number'],
      ['Solutions used to answer', numTimesSolutionViewed],
      ['Solutions not used', totalAnswersCount - numTimesSolutionViewed]
    ];
    $scope.solutionUsagePieChartOptions = (
      makeCompletionRatePieChartOptions('Solution usage statistics'));

    $scope.navigateToStateEditor = () => {
      $scope.cancel();
      RouterService.navigateToMainTab(stateName);
    };
  }
]);
