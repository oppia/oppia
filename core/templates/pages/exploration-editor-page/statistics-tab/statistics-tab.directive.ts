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

import { IStateInteractionStats } from
  'services/state-interaction-stats.service';

require(
  'pages/exploration-editor-page/statistics-tab/templates/' +
  'state-stats-modal.controller.ts');

require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/exploration/StatesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('services/alerts.service.ts');
require('services/compute-graph.service.ts');
require('services/exploration-stats.service.ts');
require('services/state-interaction-stats.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('statisticsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/statistics-tab/' +
        'statistics-tab.directive.html'),
      controller: [
        '$scope', '$uibModal', 'AlertsService', 'ComputeGraphService',
        'ExplorationDataService', 'ExplorationStatsService',
        'ReadOnlyExplorationBackendApiService', 'StateInteractionStatsService',
        'StatesObjectFactory',
        function(
            $scope, $uibModal, AlertsService, ComputeGraphService,
            ExplorationDataService, ExplorationStatsService,
            ReadOnlyExplorationBackendApiService, StateInteractionStatsService,
            StatesObjectFactory) {
          const refreshExplorationStatistics = () => {
            Promise.all([
              ReadOnlyExplorationBackendApiService.loadLatestExploration(
                ExplorationDataService.explorationId),
              ExplorationStatsService.getExplorationStats()
            ]).then(responses => {
              const [expResponse, expStats] = responses;
              const initStateName = expResponse.exploration.init_state_name;
              const numNonCompletions = (
                expStats.numActualStarts - expStats.numCompletions);

              this.states = StatesObjectFactory.createFromBackendDict(
                expResponse.exploration.states);
              this.expStats = expStats;

              console.log(JSON.stringify(expStats));

              $scope.statsGraphData = (
                ComputeGraphService.compute(initStateName, this.states));
              $scope.explorationHasBeenVisited = expStats.numActualStarts > 0;
              $scope.numPassersby = (
                expStats.numStarts - expStats.numActualStarts);
              $scope.pieChartData = [
                ['Type', 'Number'],
                ['Completions', expStats.numCompletions],
                ['Non-Completions', numNonCompletions]
              ];
              $scope.pieChartOptions = {
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
            });
          };

          const openStateStatsModal = (stateName: string) => {
            const state = this.states.getState(stateName);
            AlertsService.clearWarnings();
            return StateInteractionStatsService.computeStats(state)
              .then((stats: IStateInteractionStats) => $uibModal.open({
                controller: 'StateStatsModalController',
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/exploration-editor-page/statistics-tab/templates/' +
                  'state-stats-modal.template.html'),
                backdrop: true,
                resolve: {
                  interactionArgs: state.interaction.customizationArgs,
                  stateName: stateName,
                  stateStats: this.expStats.getStateStats(stateName),
                  visualizationsInfo: stats.visualizations_info,
                },
              }).result).then(
                () => {
                  this.stateStatsModalIsOpen = false;
                },
                () => {
                  AlertsService.clearWarnings();
                  this.stateStatsModalIsOpen = false;
                });
          };

          this.$onInit = () => {
            this.stateStatsModalIsOpen = false;
            $scope.onClickStateInStatsGraph = (stateName: string) => {
              if (!this.stateStatsModalIsOpen) {
                this.stateStatsModalIsOpen = true;
                openStateStatsModal(stateName);
              }
            };
            $scope.explorationHasBeenVisited = false;
            $scope.$on('refreshStatisticsTab', refreshExplorationStatistics);
          };
        },
      ],
    };
  },
]);
