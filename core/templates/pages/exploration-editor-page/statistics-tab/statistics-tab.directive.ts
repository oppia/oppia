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
require(
  'visualizations/oppia-visualization-enumerated-frequency-table.directive.ts');
require('visualizations/oppia-visualization-frequency-table.directive.ts');
require('visualizations/oppia-visualization-sorted-tiles.directive.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('statisticsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/statistics-tab/' +
        'statistics-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$scope', '$uibModal', 'AlertsService', 'ComputeGraphService',
        'DateTimeFormatService', 'ExplorationDataService',
        'ExplorationStatesService', 'ReadOnlyExplorationBackendApiService',
        'StateImprovementSuggestionService', 'StateInteractionStatsService',
        'StatesObjectFactory', 'UrlInterpolationService',
        'IMPROVE_TYPE_INCOMPLETE',
        function(
            $http, $scope, $uibModal, AlertsService, ComputeGraphService,
            DateTimeFormatService, ExplorationDataService,
            ExplorationStatesService, ReadOnlyExplorationBackendApiService,
            StateImprovementSuggestionService, StateInteractionStatsService,
            StatesObjectFactory, UrlInterpolationService,
            IMPROVE_TYPE_INCOMPLETE) {
          var ctrl = this;
          var _EXPLORATION_STATS_VERSION_ALL = 'all';
          var stateStatsModalIsOpen = false;

          ctrl.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
            return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
              millisSinceEpoch);
          };
          ctrl.refreshExplorationStatistics = function(version) {
            ctrl.explorationStatisticsUrl = (
              '/createhandler/statistics/' +
              ExplorationDataService.explorationId);

            // TODO(#8038): Update this to use ExplorationStatsService. Requires
            // refactoring to all consumers of state_stats_mapping to use a Map
            // rather than a plain object.
            $http.get(ctrl.explorationStatisticsUrl).then(function(
                statsResponse) {
              var data = statsResponse.data;
              var numStarts = data.num_starts;
              var numActualStarts = data.num_actual_starts;
              var numCompletions = data.num_completions;
              ctrl.stateStats = data.state_stats_mapping;

              ReadOnlyExplorationBackendApiService.loadLatestExploration(
                ExplorationDataService.explorationId).then(function(response) {
                var statesDict = response.exploration.states;
                var states = StatesObjectFactory.createFromBackendDict(
                  statesDict);
                var initStateName = response.exploration.init_state_name;

                ctrl.statsGraphData = ComputeGraphService.compute(
                  initStateName, states);
                var improvements = (
                  StateImprovementSuggestionService.getStateImprovements(
                    states, ctrl.stateStats));
                ctrl.highlightStates = {};
                improvements.forEach(function(impItem) {
                  // TODO(bhenning): This is the feedback for improvement types
                  // and should be included with the definitions of the
                  // improvement types.
                  if (impItem.type === IMPROVE_TYPE_INCOMPLETE) {
                    ctrl.highlightStates[impItem.stateName] = (
                      'May be confusing');
                  }
                });
              });

              if (numActualStarts > 0) {
                ctrl.explorationHasBeenVisited = true;
              }

              ctrl.numPassersby = numStarts - numActualStarts;
              ctrl.pieChartData = [
                ['Type', 'Number'],
                ['Completions', numCompletions],
                ['Non-Completions', numActualStarts - numCompletions]
              ];
            });
          };
          ctrl.onClickStateInStatsGraph = function(stateName) {
            if (!stateStatsModalIsOpen) {
              stateStatsModalIsOpen = true;
              ctrl.showStateStatsModal(
                stateName, ctrl.highlightStates[stateName]);
            }
          };

          ctrl.showStateStatsModal = function(stateName, improvementType) {
            AlertsService.clearWarnings();

            StateInteractionStatsService.computeStats(
              ExplorationStatesService.getState(stateName)
            ).then(stats => $uibModal.open({
              controller: 'StateStatsModalController',
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/statistics-tab/templates/' +
                'state-stats-modal.template.html'),
              backdrop: true,
              resolve: {
                improvementType: function() {
                  return improvementType;
                },
                stateName: function() {
                  return stateName;
                },
                stateStats: function() {
                  return ctrl.stateStats[stateName];
                },
                stateStatsModalIsOpen: function() {
                  return stateStatsModalIsOpen;
                },
                visualizationsInfo: function() {
                  return stats.visualizations_info;
                }
              },
            }).result.then(
              () => {
                stateStatsModalIsOpen = false;
              },
              () => {
                AlertsService.clearWarnings();
                stateStatsModalIsOpen = false;
              }));
          };

          ctrl.$onInit = function() {
            $scope.$on('refreshStatisticsTab', function() {
              ctrl.refreshExplorationStatistics(_EXPLORATION_STATS_VERSION_ALL);
            });
            ctrl.COMPLETION_RATE_CHART_OPTIONS = {
              chartAreaWidth: 300,
              colors: ['green', 'firebrick'],
              height: 100,
              legendPosition: 'right',
              width: 500
            };
            ctrl.COMPLETION_RATE_PIE_CHART_OPTIONS = {
              title: '',
              left: 230,
              pieHole: 0.6,
              pieSliceTextStyleColor: 'black',
              pieSliceBorderColor: 'black',
              chartAreaWidth: 500,
              colors: ['#008808', '#d8d8d8'],
              height: 300,
              legendPosition: 'right',
              width: 600
            };
            ctrl.currentVersion = _EXPLORATION_STATS_VERSION_ALL;

            ctrl.hasTabLoaded = false;

            ctrl.explorationHasBeenVisited = false;
          };
        }
      ]
    };
  }]);
