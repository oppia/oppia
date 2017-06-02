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
 * @fileoverview Controllers for the exploration statistics tab in the
 * exploration editor.
 */

oppia.constant('IMPROVE_TYPE_DEFAULT', 'default');
oppia.constant('IMPROVE_TYPE_INCOMPLETE', 'incomplete');

oppia.controller('StatisticsTab', [
  '$scope', '$http', '$modal', 'alertsService', 'explorationStatesService',
  'explorationData', 'computeGraphService', 'oppiaDatetimeFormatter',
  'StatesObjectFactory', 'StateImprovementSuggestionService',
  'ReadOnlyExplorationBackendApiService',
  'IMPROVE_TYPE_DEFAULT', 'IMPROVE_TYPE_INCOMPLETE',
  function(
      $scope, $http, $modal, alertsService, explorationStatesService,
      explorationData, computeGraphService, oppiaDatetimeFormatter,
      StatesObjectFactory, StateImprovementSuggestionService,
      ReadOnlyExplorationBackendApiService,
      IMPROVE_TYPE_DEFAULT, IMPROVE_TYPE_INCOMPLETE) {
    $scope.COMPLETION_RATE_CHART_OPTIONS = {
      chartAreaWidth: 300,
      colors: ['green', 'firebrick'],
      height: 100,
      legendPosition: 'right',
      width: 500
    };
    var _EXPLORATION_STATS_VERSION_ALL = 'all';
    $scope.currentVersion = _EXPLORATION_STATS_VERSION_ALL;

    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.hasTabLoaded = false;
    $scope.$on('refreshStatisticsTab', function() {
      $scope.refreshExplorationStatistics(_EXPLORATION_STATS_VERSION_ALL);
      $scope.explorationVersionUrl = (
        '/createhandler/statisticsversion/' + explorationData.explorationId);
      $http.get($scope.explorationVersionUrl).then(function(response) {
        $scope.versions = response.data.versions;
        $scope.currentVersion = _EXPLORATION_STATS_VERSION_ALL;
      });
    });

    $scope.hasExplorationBeenVisited = false;
    $scope.refreshExplorationStatistics = function(version) {
      $scope.explorationStatisticsUrl = (
        '/createhandler/statistics/' + explorationData.explorationId +
        '/' + version);
      $http.get($scope.explorationStatisticsUrl).then(function(response) {
        ReadOnlyExplorationBackendApiService.loadLatestExploration(
          explorationData.explorationId).then(function(response) {
            var statesDict = response.exploration.states;
            var states = StatesObjectFactory.createFromBackendDict(statesDict);
            var initStateName = response.exploration.init_state_name;

            $scope.statsGraphData = computeGraphService.compute(
              initStateName, states);
            var improvements = (
              StateImprovementSuggestionService.getStateImprovements(
                states, $scope.stateStats));
            $scope.highlightStates = {};
            improvements.forEach(function(impItem) {
              // TODO(bhenning): This is the feedback for improvement types and
              // should be included with the definitions of the improvement
              // types.
              if (impItem.type === IMPROVE_TYPE_DEFAULT) {
                $scope.highlightStates[impItem.stateName] = (
                  'Needs more feedback');
              } else if (impItem.type === IMPROVE_TYPE_INCOMPLETE) {
                $scope.highlightStates[impItem.stateName] = 'May be confusing';
              }
            });
          }
        );
        var data = response.data;
        var numVisits = data.num_starts;
        var numCompletions = data.num_completions;
        var improvements = data.improvements;
        $scope.stateStats = data.state_stats;
        $scope.lastUpdated = data.last_updated;

        if (numVisits > 0) {
          $scope.hasExplorationBeenVisited = true;
        }

        $scope.chartData = [
          ['', 'Completions', 'Non-completions'],
          ['', numCompletions, numVisits - numCompletions]
        ];

        $scope.statsGraphOpacities = {
          legend: 'Students entering state'
        };
        // TODO(bhenning): before, there was a special opacity computed for the
        // ending (numCompletions/numVisits), should we do this for all
        // terminal nodes, instead? If so, explorationStatesService needs to be
        // able to provide whether given states are terminal

        explorationStatesService.getStateNames().forEach(function(stateName) {
          var visits = 0;
          if ($scope.stateStats.hasOwnProperty(stateName)) {
            visits = $scope.stateStats[stateName].first_entry_count;
          }
          $scope.statsGraphOpacities[stateName] = Math.max(
            visits / numVisits, 0.05);
        });

        $scope.hasTabLoaded = true;
      });
    };

    $scope.onClickStateInStatsGraph = function(stateName) {
      $scope.showStateStatsModal(stateName, $scope.highlightStates[stateName]);
    };

    $scope.showStateStatsModal = function(stateName, improvementType) {
      alertsService.clearWarnings();

      $http.get(
        '/createhandler/state_rules_stats/' + $scope.explorationId + '/' +
        encodeURIComponent(stateName)
      ).then(function(response) {
        $modal.open({
          templateUrl: 'modals/stateStats',
          backdrop: true,
          resolve: {
            stateName: function() {
              return stateName;
            },
            stateStats: function() {
              return $scope.stateStats[stateName];
            },
            improvementType: function() {
              return improvementType;
            },
            visualizationsInfo: function() {
              return response.data.visualizations_info;
            }
          },
          controller: [
            '$scope', '$modalInstance', '$filter', 'stateName', 'stateStats',
            'improvementType', 'visualizationsInfo', 'oppiaHtmlEscaper',
            function($scope, $modalInstance, $filter, stateName, stateStats,
                improvementType, visualizationsInfo, oppiaHtmlEscaper) {
              $scope.stateName = stateName;
              $scope.stateStats = stateStats;
              $scope.improvementType = improvementType;

              var _getVisualizationsHtml = function() {
                var htmlSnippets = [];

                for (var i = 0; i < visualizationsInfo.length; i++) {
                  var el = $(
                    '<oppia-visualization-' +
                    $filter('camelCaseToHyphens')(visualizationsInfo[i].id) +
                    '/>');
                  el.attr('data', oppiaHtmlEscaper.objToEscapedJson(
                    visualizationsInfo[i].data));
                  el.attr('options', oppiaHtmlEscaper.objToEscapedJson(
                    visualizationsInfo[i].options));
                  htmlSnippets.push(el.get(0).outerHTML);
                }
                return htmlSnippets.join('');
              };

              $scope.visualizationsHtml = _getVisualizationsHtml();

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        });
      });
    };
  }
]);
