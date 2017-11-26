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

oppia.constant('IMPROVE_TYPE_INCOMPLETE', 'incomplete');

oppia.controller('StatisticsTab', [
  '$scope', '$http', '$modal', 'AlertsService', 'explorationStatesService',
  'ExplorationDataService', 'computeGraphService', 'oppiaDatetimeFormatter',
  'StatesObjectFactory', 'StateImprovementSuggestionService',
  'ReadOnlyExplorationBackendApiService', 'UrlInterpolationService',
  'IMPROVE_TYPE_INCOMPLETE', 'ENABLE_NEW_STATS_FRAMEWORK',
  function(
      $scope, $http, $modal, AlertsService, explorationStatesService,
      ExplorationDataService, computeGraphService, oppiaDatetimeFormatter,
      StatesObjectFactory, StateImprovementSuggestionService,
      ReadOnlyExplorationBackendApiService, UrlInterpolationService,
      IMPROVE_TYPE_INCOMPLETE, ENABLE_NEW_STATS_FRAMEWORK) {
    $scope.COMPLETION_RATE_CHART_OPTIONS = {
      chartAreaWidth: 300,
      colors: ['green', 'firebrick'],
      height: 100,
      legendPosition: 'right',
      width: 500
    };
    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS = {
      title: '',
      left: 230,
      pieHole: 0.6,
      pieSliceTextStyleColor: 'black',
      pieSliceBorderColor: 'black',
      chartAreaWidth: 500,
      colors: ['#d8d8d8', '#008808', 'blue'],
      height: 300,
      legendPosition: 'right',
      width: 600
    };
    var _EXPLORATION_STATS_VERSION_ALL = 'all';
    $scope.currentVersion = _EXPLORATION_STATS_VERSION_ALL;

    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.ENABLE_NEW_STATS_FRAMEWORK = ENABLE_NEW_STATS_FRAMEWORK;
    $scope.hasTabLoaded = false;
    $scope.$on('refreshStatisticsTab', function() {
      $scope.refreshExplorationStatistics(_EXPLORATION_STATS_VERSION_ALL);
      $scope.explorationVersionUrl = (
        '/createhandler/statisticsversion/' +
        ExplorationDataService.explorationId);
      $http.get($scope.explorationVersionUrl).then(function(response) {
        $scope.versions = response.data.versions;
        $scope.currentVersion = _EXPLORATION_STATS_VERSION_ALL;
      });
    });

    $scope.explorationHasBeenVisited = false;
    $scope.refreshExplorationStatistics = function(version) {
      if ($scope.ENABLE_NEW_STATS_FRAMEWORK) {
        $scope.explorationStatisticsUrl = (
          '/createhandler/statistics/' + ExplorationDataService.explorationId);
      } else {
        $scope.explorationStatisticsUrl = (
          '/createhandler/statistics_old/' +
          ExplorationDataService.explorationId + '/' + version);
      }

      $http.get($scope.explorationStatisticsUrl).then(function(response) {
        ReadOnlyExplorationBackendApiService.loadLatestExploration(
          ExplorationDataService.explorationId).then(function(response) {
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
              // TODO(bhenning): This is the feedback for improvement types
              // and should be included with the definitions of the
              // improvement types.
              if (impItem.type === IMPROVE_TYPE_INCOMPLETE) {
                $scope.highlightStates[impItem.stateName] = (
                  'May be confusing');
              }
            });
          }
        );
        // From this point on, all computation done is for the new stats
        // framework under a development flag.
        if ($scope.ENABLE_NEW_STATS_FRAMEWORK) {
          var data = response.data;
          var numStarts = data.num_starts;
          var numActualStarts = data.num_actual_starts;
          var numCompletions = data.num_completions;
          $scope.stateStats = data.state_stats_mapping;

          if (numStarts > 0) {
            $scope.explorationHasBeenVisited = true;
          }

          $scope.pieChartData = [
            ['Type', 'Number'],
            ['Passerby', numStarts - numActualStarts],
            ['Completions', numCompletions],
            ['Non-Completions', numActualStarts - numCompletions]
          ];
        } else {
          var data = response.data;
          var numVisits = data.num_starts;
          var numCompletions = data.num_completions;
          var improvements = data.improvements;
          $scope.stateStats = data.state_stats;
          $scope.lastUpdated = data.last_updated;

          if (numVisits > 0) {
            $scope.explorationHasBeenVisited = true;
          }

          $scope.chartData = [
            ['', 'Completions', 'Non-completions'],
            ['', numCompletions, numVisits - numCompletions]
          ];

          $scope.statsGraphOpacities = {
            legend: 'Students entering state'
          };
          // TODO(bhenning): before, there was a special opacity computed for
          // the ending (numCompletions/numVisits), should we do this for all
          // terminal nodes, instead? If so, explorationStatesService needs to
          // be able to provide whether given states are terminal

          explorationStatesService.getStateNames().forEach(function(stateName) {
            var visits = 0;
            if ($scope.stateStats.hasOwnProperty(stateName)) {
              visits = $scope.stateStats[stateName].first_entry_count;
            }
            $scope.statsGraphOpacities[stateName] = Math.max(
              visits / numVisits, 0.05);
          });

          $scope.hasTabLoaded = true;
        }
      });
    };

    $scope.onClickStateInStatsGraph = function(stateName) {
      $scope.showStateStatsModal(stateName, $scope.highlightStates[stateName]);
    };

    $scope.showStateStatsModal = function(stateName, improvementType) {
      AlertsService.clearWarnings();

      $http.get(
        '/createhandler/state_rules_stats/' + $scope.explorationId + '/' +
        encodeURIComponent(stateName)
      ).then(function(response) {
        $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/statistics_tab/' +
            'state_stats_modal_directive.html'),
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
            'improvementType', 'visualizationsInfo', 'HtmlEscaperService',
            'ENABLE_NEW_STATS_FRAMEWORK',
            function($scope, $modalInstance, $filter, stateName, stateStats,
                improvementType, visualizationsInfo, HtmlEscaperService,
                ENABLE_NEW_STATS_FRAMEWORK) {
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
              $scope.COMPLETION_RATE_PIE_CHART_OPTIONS1.title = title1

              var title2 = 'Solution usage statistics';
              $scope.COMPLETION_RATE_PIE_CHART_OPTIONS2 = angular.copy(
                COMPLETION_RATE_PIE_CHART_OPTIONS);
              $scope.COMPLETION_RATE_PIE_CHART_OPTIONS2.title = title2

              $scope.stateName = stateName;
              $scope.stateStats = stateStats;
              $scope.improvementType = improvementType;

              $scope.ENABLE_NEW_STATS_FRAMEWORK = ENABLE_NEW_STATS_FRAMEWORK;

              var usefulFeedbackCount = (
                $scope.stateStats.useful_feedback_count);
              var totalAnswersCount = (
                $scope.stateStats.total_answers_count);
              if (totalAnswersCount > 0) {
                $scope.hasExplorationBeenAnswered = true;
              }
              $scope.pieChartData1 = [
                ['Type', 'Number'],
                ['Default feedback', totalAnswersCount - usefulFeedbackCount],
                ['Useful feedback', usefulFeedbackCount],
              ];

              var numTimesSolutionViewed = (
                $scope.stateStats.num_times_solution_viewed);
              $scope.pieChartData2 = [
                ['Type', 'Number'],
                ['Solutions used to answer', numTimesSolutionViewed],
                ['Solutions not used', totalAnswersCount - (
                  numTimesSolutionViewed)]
              ];

              var _getVisualizationsHtml = function() {
                var htmlSnippets = [];

                for (var i = 0; i < visualizationsInfo.length; i++) {
                  var el = $(
                    '<oppia-visualization-' +
                    $filter('camelCaseToHyphens')(visualizationsInfo[i].id) +
                    '/>');
                  el.attr('data', HtmlEscaperService.objToEscapedJson(
                    visualizationsInfo[i].data));
                  el.attr('options', HtmlEscaperService.objToEscapedJson(
                    visualizationsInfo[i].options));
                  htmlSnippets.push(el.get(0).outerHTML);
                }
                return htmlSnippets.join('');
              };

              $scope.visualizationsHtml = _getVisualizationsHtml();

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        });
      });
    };
  }
]);
