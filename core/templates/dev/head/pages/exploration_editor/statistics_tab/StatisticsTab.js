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
  '$scope', '$http', '$uibModal', 'AlertsService', 'ExplorationStatesService',
  'ExplorationDataService', 'ComputeGraphService', 'DateTimeFormatService',
  'StatesObjectFactory', 'StateImprovementSuggestionService',
  'ReadOnlyExplorationBackendApiService', 'UrlInterpolationService',
  'RouterService', 'IMPROVE_TYPE_INCOMPLETE',
  function(
      $scope, $http, $uibModal, AlertsService, ExplorationStatesService,
      ExplorationDataService, ComputeGraphService, DateTimeFormatService,
      StatesObjectFactory, StateImprovementSuggestionService,
      ReadOnlyExplorationBackendApiService, UrlInterpolationService,
      RouterService, IMPROVE_TYPE_INCOMPLETE) {
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
      colors: ['#008808', '#d8d8d8'],
      height: 300,
      legendPosition: 'right',
      width: 600
    };
    var _EXPLORATION_STATS_VERSION_ALL = 'all';
    $scope.currentVersion = _EXPLORATION_STATS_VERSION_ALL;

    $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
      return DateTimeFormatService.getLocaleAbbreviatedDatetimeString(
        millisSinceEpoch);
    };

    $scope.hasTabLoaded = false;
    $scope.$on('refreshStatisticsTab', function() {
      $scope.refreshExplorationStatistics(_EXPLORATION_STATS_VERSION_ALL);
    });

    $scope.explorationHasBeenVisited = false;
    $scope.refreshExplorationStatistics = function(version) {
      $scope.explorationStatisticsUrl = (
        '/createhandler/statistics/' + ExplorationDataService.explorationId);

      $http.get($scope.explorationStatisticsUrl).then(function(statsResponse) {
        var data = statsResponse.data;
        var numStarts = data.num_starts;
        var numActualStarts = data.num_actual_starts;
        var numCompletions = data.num_completions;
        $scope.stateStats = data.state_stats_mapping;

        ReadOnlyExplorationBackendApiService.loadLatestExploration(
          ExplorationDataService.explorationId).then(function(response) {
            var statesDict = response.exploration.states;
            var states = StatesObjectFactory.createFromBackendDict(statesDict);
            var initStateName = response.exploration.init_state_name;

            $scope.statsGraphData = ComputeGraphService.compute(
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

        if (numActualStarts > 0) {
          $scope.explorationHasBeenVisited = true;
        }

        $scope.numPassersby = numStarts - numActualStarts;
        $scope.pieChartData = [
          ['Type', 'Number'],
          ['Completions', numCompletions],
          ['Non-Completions', numActualStarts - numCompletions]
        ];
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
        $uibModal.open({
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
            '$scope', '$uibModalInstance', '$filter', '$injector', 'stateName',
            'stateStats', 'improvementType', 'visualizationsInfo',
            'HtmlEscaperService', 'AngularNameService',
            'AnswerClassificationService',
            function($scope, $uibModalInstance, $filter, $injector, stateName,
                stateStats, improvementType, visualizationsInfo,
                HtmlEscaperService, AngularNameService,
                AnswerClassificationService) {
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
              $scope.improvementType = improvementType;

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
                ['Specific feedback', usefulFeedbackCount],
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
                htmlSnippets = visualizationsInfo.map(
                  function(visualizationInfo) {
                    var isAddressedResults = null;
                    if (visualizationInfo.show_addressed_info) {
                      var explorationId = ExplorationDataService.explorationId;
                      var state = ExplorationStatesService.getState(
                        $scope.stateName);

                      isAddressedResults = visualizationInfo.data.map(
                        function(datum) {
                          var interactionId = state.interaction.id;
                          var rulesServiceName = (
                            AngularNameService.getNameOfInteractionRulesService(
                              interactionId));
                          var rulesService = $injector.get(rulesServiceName);
                          return (
                            AnswerClassificationService
                              .isClassifiedExplicitlyOrGoesToNewState(
                                explorationId, state.name, state,
                                datum.answer, rulesService
                              )
                          );
                        }
                      );
                    }

                    var escapedData = HtmlEscaperService.objToEscapedJson(
                      visualizationInfo.data);
                    var escapedOptions = HtmlEscaperService.objToEscapedJson(
                      visualizationInfo.options);
                    var escapedIsAddressedResults =
                      HtmlEscaperService.objToEscapedJson(isAddressedResults);

                    var el = $(
                      '<oppia-visualization-' +
                      $filter('camelCaseToHyphens')(visualizationInfo.id) +
                      '/>');
                    el.attr('data', escapedData);
                    el.attr('options', escapedOptions);
                    el.attr('is-addressed', escapedIsAddressedResults);
                    return el.get(0).outerHTML;
                  });

                return htmlSnippets.join('');
              };

              $scope.visualizationsHtml = _getVisualizationsHtml();

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };

              $scope.navigateToStateEditor = function() {
                $scope.cancel();
                RouterService.navigateToMainTab(stateName);
              };
            }
          ]
        });
      });
    };
  }
]);
