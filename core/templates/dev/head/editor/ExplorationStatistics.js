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
 * @fileoverview Controllers for the exploration statistics tab in the exploration editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('ExplorationStatistics', [
    '$scope', '$http', '$location', '$modal', 'warningsData',
    function($scope, $http, $location, $modal, warningsData) {
  $scope.COMPLETION_RATE_CHART_OPTIONS = {
    chartAreaWidth: 300,
    colors: ['green', 'firebrick'],
    height: 100,
    legendPosition: 'right',
    width: 500
  };

  $scope.hasTabLoaded = false;
  $scope.$on('refreshStatisticsTab', function(evt) {
    $scope.refreshExplorationStatistics();
  });

  $scope.hasExplorationBeenVisited = false;
  $scope.refreshExplorationStatistics = function() {
    $scope.explorationStatisticsUrl = '/createhandler/statistics/' + $scope.$parent.explorationId;
    $http.get($scope.explorationStatisticsUrl).then(function(response) {
      var data = response.data;
      var numVisits = data.num_starts;
      var numCompletions = data.num_completions;
      var improvements = data.improvements;
      $scope.stateStats = data.state_stats;

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
      for (var stateName in $scope.states) {
        var visits = $scope.stateStats[stateName].firstEntryCount;
        $scope.statsGraphOpacities[stateName] = Math.max(
          visits / numVisits, 0.05);
      }
      $scope.statsGraphOpacities[END_DEST] = Math.max(
        numCompletions / numVisits, 0.05);

      $scope.highlightStates = {};
      improvements.forEach(function(impItem) {
        if (impItem.type == 'default') {
          $scope.highlightStates[impItem.state_name] = 'Needs more feedback';
        } else if (impItem.type == 'incomplete') {
          $scope.highlightStates[impItem.state_name] = 'May be confusing';
        }
      });

      $scope.hasTabLoaded = true;
    });
  };

  $scope.onClickStateInStatsGraph = function(stateName) {
    if (stateName !== END_DEST) {
      $scope.showStateStatsModal(stateName, $scope.highlightStates[stateName]);
    }
  };

  $scope.showStateStatsModal = function(stateName, improvementType) {
    warningsData.clear();

    $http.get(
      '/createhandler/state_rules_stats/' + $scope.explorationId + '/' + encodeURIComponent(stateName)
    ).then(function(response) {
      $modal.open({
        templateUrl: 'modals/stateStats',
        backdrop: 'static',
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
          '$scope', '$modalInstance', 'editabilityService', 'stateName',
          'stateStats', 'improvementType', 'rulesStats', function(
             $scope, $modalInstance, editabilityService, stateName,
             stateStats, improvementType, rulesStats) {
          $scope.editabilityService = editabilityService;
          $scope.stateName = stateName;
          $scope.stateStats = stateStats;
          $scope.improvementType = improvementType;
          $scope.rulesStats = rulesStats;

          $scope.getNumTimesString = function(numberOfTimes) {
            var suffix = (numberOfTimes == 1 ? ' time' : ' times');
            return numberOfTimes + suffix;
          };

          $scope.getHumanReadableRuleName = function(ruleName) {
            return ruleName.substring('submit.'.length);
          };

          $scope.isEmpty = function(obj) {
            for (var property in obj) {
              if (obj.hasOwnProperty(property)) {
                return false;
              }
            }
            return true;
          };

          $scope.doesAnswerExist = function() {
            for (var rule in $scope.rulesStats) {
              if ($scope.rulesStats[rule].answers.length > 0) {
                return true;
              }
            }
            return false;
          };

          $scope.gotoStateEditor = function(locationHash) {
            $modalInstance.close({});
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }]
      }).result.then(function(result) {
        $scope.$parent.showStateEditor(stateName);
      });
    });
  };
}]);
