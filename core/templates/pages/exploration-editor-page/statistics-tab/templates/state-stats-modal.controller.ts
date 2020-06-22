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

require('visualizations/oppia-visualization-bar-chart.directive.ts');
require('visualizations/oppia-visualization-click-hexbins.directive.ts');
require(
  'visualizations/oppia-visualization-enumerated-frequency-table.directive.ts');
require('visualizations/oppia-visualization-frequency-table.directive.ts');
require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

require('pages/exploration-editor-page/services/router.service.ts');

angular.module('oppia').controller('StateStatsModalController', [
  '$controller', '$scope', '$uibModalInstance', 'RouterService',
  'interactionArgs', 'stateName', 'stateStats', 'visualizationsInfo',
  function(
      $controller, $scope, $uibModalInstance, RouterService,
      interactionArgs, stateName, stateStats, visualizationsInfo) {
    console.log('hello..?');

    $controller('ConfirmOrCancelModalController', {$scope, $uibModalInstance});

    var COMPLETION_RATE_PIE_CHART_OPTIONS = {
      left: 20,
      pieHole: 0.6,
      pieSliceTextStyleColor: 'black',
      pieSliceBorderColor: 'black',
      chartAreaWidth: 240,
      colors: ['#d8d8d8', '#008808', 'blue'],
      height: 270,
      legendPosition: 'right',
      width: 240
    };

    var title1 = 'Answer feedback statistics';
    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS1 = angular.copy(
      COMPLETION_RATE_PIE_CHART_OPTIONS);
    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS1.title = title1;

    var title2 = 'Solution usage statistics';
    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS2 = angular.copy(
      COMPLETION_RATE_PIE_CHART_OPTIONS);
    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS2.title = title2;

    $scope.stateName = stateName;
    $scope.stateStats = stateStats;
    $scope.interactionArgs = interactionArgs;
    $scope.visualizationsInfo = visualizationsInfo;

    var usefulFeedbackCount = $scope.stateStats.usefulFeedbackCount;
    var totalAnswersCount = $scope.stateStats.totalAnswersCount;
    if (totalAnswersCount > 0) {
      $scope.hasExplorationBeenAnswered = true;
    }
    $scope.pieChartData1 = [
      ['Type', 'Number'],
      ['Default feedback', totalAnswersCount - usefulFeedbackCount],
      ['Specific feedback', usefulFeedbackCount],
    ];

    var numTimesSolutionViewed = $scope.stateStats.numTimesSolutionViewed;
    $scope.pieChartData2 = [
      ['Type', 'Number'],
      ['Solutions used to answer', numTimesSolutionViewed],
      ['Solutions not used', totalAnswersCount - numTimesSolutionViewed]
    ];

    console.log(':o');
    $scope.navigateToStateEditor = function() {
      $scope.cancel();
      RouterService.navigateToMainTab(stateName);
    };
    console.log(':)');
  }
]);
