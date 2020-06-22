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
 * @fileoverview Directive for the exploration statistics tab in the
 * exploration editor.
 */

require(
  'pages/exploration-editor-page/statistics-tab/templates/' +
  'state-stats-modal.controller.ts');

require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/exploration/StatesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'state-improvement-suggestion.service.ts'
);
require('services/alerts.service.ts');
require('services/compute-graph.service.ts');
require('services/date-time-format.service.ts');
require('services/state-interaction-stats.service.ts');
require('visualizations/oppia-visualization-bar-chart.directive.ts');
require('visualizations/oppia-visualization-click-hexbins.directive.ts');
require(
  'visualizations/oppia-visualization-enumerated-frequency-table.directive.ts');
require('visualizations/oppia-visualization-frequency-table.directive.ts');
require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('statisticsTab', () => ({
  restrict: 'E',
  template: require('./statistics-tab.directive.html'),
  controller: [
    '$http', '$scope', '$uibModal', 'AlertsService', 'ComputeGraphService',
    'ExplorationDataService',
    'ExplorationStatesService', 'ReadOnlyExplorationBackendApiService',
    'StateImprovementSuggestionService', 'StateInteractionStatsService',
    'StatesObjectFactory', 'UrlInterpolationService',
    'IMPROVE_TYPE_INCOMPLETE',
    function(
        $http, $scope, $uibModal, AlertsService, ComputeGraphService,
        ExplorationDataService,
        ExplorationStatesService, ReadOnlyExplorationBackendApiService,
        StateImprovementSuggestionService, StateInteractionStatsService,
        StatesObjectFactory, UrlInterpolationService,
        IMPROVE_TYPE_INCOMPLETE) {
      let stateStatsModalIsOpen = false;
      let states = null;

      const refreshExplorationStatistics = () => {
        // TODO(#8038): Update this to use ExplorationStatsService. Requires
        // refactoring consumers of state_stats_mapping to use a Map rather than
        // a plain object.
        const explorationStatisticsUrl = UrlInterpolationService.interpolateUrl(
          '/createhandler/statistics/<exploration_id>', {
            exploration_id: ExplorationDataService.explorationId
          });

        Promise.all([
          ReadOnlyExplorationBackendApiService.loadLatestExploration(
            ExplorationDataService.explorationId),
          $http.get(explorationStatisticsUrl),
        ]).then(responses => {
          const [expResponse, statsResponse] = responses;
          const initStateName = expResponse.exploration.init_state_name;
          const numStarts = statsResponse.data.num_starts;
          const numActualStarts = statsResponse.data.num_actual_starts;
          const numCompletions = statsResponse.data.num_completions;
          const stateStatsMapping = statsResponse.data.state_stats_mapping;

          states = StatesObjectFactory.createFromBackendDict(
            expResponse.exploration.states);
          $scope.stateStats = stateStatsMapping;

          const improvements = (
            StateImprovementSuggestionService.getStateImprovements(
              states, $scope.stateStats));

          $scope.statsGraphData = (
            ComputeGraphService.compute(initStateName, states));
          $scope.highlightStates = {};
          improvements.forEach(item => {
            // TODO(bhenning): This is the feedback for improvement types
            // and should be included with the definitions of the
            // improvement types.
            if (item.type === IMPROVE_TYPE_INCOMPLETE) {
              $scope.highlightStates[item.stateName] = 'May be confusing';
            }
          });

          $scope.explorationHasBeenVisited = numActualStarts > 0;
          $scope.numPassersby = numStarts - numActualStarts;
          $scope.pieChartData = [
            ['Type', 'Number'],
            ['Completions', numCompletions],
            ['Non-Completions', numActualStarts - numCompletions]
          ];
        });
      };

      const openStateStatsModal = (stateName, improvementType) => {
        AlertsService.clearWarnings();
        StateInteractionStatsService
          .computeStats(ExplorationStatesService.getState(stateName))
          .then(stats => $uibModal.open({
            controller: 'StateStatsModalController',
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/exploration-editor-page/statistics-tab/templates/' +
              'state-stats-modal.template.html'),
            backdrop: true,
            resolve: {
              improvementType: () => improvementType,
              stateName: () => stateName,
              stateStats: () => $scope.stateStats[stateName],
              visualizationsInfo: () => stats.visualizations_info,
              interactionArgs: () => (
                states.getState(stateName).interaction.customizationArgs)
            },
          }).result)
          .then(
            () => {
              stateStatsModalIsOpen = false;
            },
            () => {
              AlertsService.clearWarnings();
              stateStatsModalIsOpen = false;
            });
      };

      $scope.onClickStateInStatsGraph = (stateName) => {
        if (!stateStatsModalIsOpen) {
          stateStatsModalIsOpen = true;
          openStateStatsModal(stateName, $scope.highlightStates[stateName]);
        }
      };

      this.$onInit = () => {
        $scope.explorationHasBeenVisited = false;
        $scope.COMPLETION_RATE_PIE_CHART_OPTIONS = {
          chartAreaWidth: 500,
          colors: ['#008808', '#d8d8d8'],
          height: 300,
          left: 230,
          legendPosition: 'right',
          pieHole: 0.6,
          pieSliceBorderColor: 'black',
          pieSliceTextStyleColor: 'black',
          title: '',
          width: 600,
        };
        $scope.$on('refreshStatisticsTab', refreshExplorationStatistics);
      };
    },
  ],
}));
