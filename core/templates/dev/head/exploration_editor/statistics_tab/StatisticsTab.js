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

oppia.controller('StatisticsTab', [
  '$scope', '$http', '$modal', 'alertsService', 'explorationStatesService',
  'explorationData', 'computeGraphService', 'oppiaDatetimeFormatter',
  function(
      $scope, $http, $modal, alertsService, explorationStatesService,
      explorationData, computeGraphService, oppiaDatetimeFormatter) {
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
        var explorationDataUrl = (
          '/createhandler/data/' + explorationData.explorationId);

        $http.get(explorationDataUrl).then(function(response) {
          var states = response.data.states;
          var initStateName = response.data.init_state_name;
          $scope.statsGraphData = computeGraphService.compute(
            initStateName, states);
        });

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
        for (var stateName in explorationStatesService.getStates()) {
          var visits = 0;
          if ($scope.stateStats.hasOwnProperty(stateName)) {
            visits = $scope.stateStats[stateName].firstEntryCount;
          }
          $scope.statsGraphOpacities[stateName] = Math.max(
            visits / numVisits, 0.05);
        }

        $scope.highlightStates = {};
        improvements.forEach(function(impItem) {
          if (impItem.type === 'default') {
            $scope.highlightStates[impItem.state_name] = 'Needs more feedback';
          } else if (impItem.type === 'incomplete') {
            $scope.highlightStates[impItem.state_name] = 'May be confusing';
          }
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
            rulesStats: function() {
              return response.data.rules_stats;
            }
          },
          controller: [
            '$scope', '$modalInstance', 'stateName', 'stateStats',
            'improvementType', 'rulesStats', 'utilsService',
            function(
                $scope, $modalInstance, stateName,
                stateStats, improvementType, rulesStats, utilsService) {
              $scope.stateName = stateName;
              $scope.stateStats = stateStats;
              $scope.improvementType = improvementType;
              $scope.rulesStats = rulesStats;

              $scope.getNumTimesString = function(numberOfTimes) {
                var suffix = (numberOfTimes === 1 ? ' time' : ' times');
                return numberOfTimes + suffix;
              };

              $scope.getHumanReadableRuleName = function(ruleName) {
                return ruleName.substring('submit.'.length);
              };

              $scope.isEmpty = utilsService.isEmpty;

              $scope.doesAnswerExist = function() {
                for (var rule in $scope.rulesStats) {
                  if ($scope.rulesStats[rule].answers.length > 0) {
                    return true;
                  }
                }
                return false;
              };

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
