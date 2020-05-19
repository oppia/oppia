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
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/exploration/StatesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/camel-case-to-hyphens.filter.ts');
require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'state-improvement-suggestion.service.ts');
require('services/alerts.service.ts');
require('services/compute-graph.service.ts');
require('services/date-time-format.service.ts');
require('services/exploration-features.service.ts');
require('services/state-interaction-stats.service.ts');
require('visualizations/oppia-visualization-bar-chart.directive.ts');
require('visualizations/oppia-visualization-click-hexbins.directive.ts');
require(
  'visualizations/oppia-visualization-enumerated-frequency-table.directive.ts');
require('visualizations/oppia-visualization-frequency-table.directive.ts');

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
        'ExplorationFeaturesService', 'ExplorationStatesService',
        'ReadOnlyExplorationBackendApiService', 'RouterService',
        'StateImprovementSuggestionService', 'StateInteractionStatsService',
        'StatesObjectFactory', 'UrlInterpolationService',
        'IMPROVE_TYPE_INCOMPLETE',
        function(
            $http, $scope, $uibModal, AlertsService, ComputeGraphService,
            DateTimeFormatService, ExplorationDataService,
            ExplorationFeaturesService, ExplorationStatesService,
            ReadOnlyExplorationBackendApiService, RouterService,
            StateImprovementSuggestionService, StateInteractionStatsService,
            StatesObjectFactory, UrlInterpolationService,
            IMPROVE_TYPE_INCOMPLETE) {
          const ctrl = this;
          const newCompletionRatePieChartOptions = title => ({
            chartAreaWidth: 240,
            colors: ['#d8d8d8', '#008808', 'blue'],
            height: 270,
            left: 20,
            legendPosition: 'right',
            pieHole: 0.6,
            pieSliceBorderColor: 'black',
            pieSliceTextStyleColor: 'black',
            title: title,
            width: 240,
          });

          const loadLatestExploration = () => {
            return ReadOnlyExplorationBackendApiService.loadLatestExploration(
              ExplorationDataService.explorationId
            ).then(response => {
              const { init_state_name: initStateName, states } = (
                response.exploration);
              ctrl.states = (
                StatesObjectFactory.createFromBackendDict(states));
              ctrl.statsGraphData = (
                ComputeGraphService.compute(initStateName, ctrl.states));
              ctrl.playthroughsAreAvailable = (
                ExplorationFeaturesService.isPlaythroughRecordingEnabled() &&
                !ExplorationFeaturesService.isImprovementsTabEnabled());
            });
          };

          ctrl.getLocaleAbbreviatedDatetimeString = (
            DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

          ctrl.refreshExplorationStatistics = () => {
            // TODO(#8038): Move this into a backend-api.service module.
            return $http.get(
              UrlInterpolationService.interpolateUrl(
                '/createhandler/statistics/<exploration_id>', {
                  exploration_id: ExplorationDataService.explorationId
                })
            ).then(response => {
              const {
                num_actual_starts: numActualStarts,
                num_completions: numCompletions,
                num_starts: numStarts,
                state_stats_mapping: stateStats,
              } = response.data;

              ctrl.stateStats = stateStats;

              loadLatestExploration().then(() => {
                const improvementSuggestions = (
                  StateImprovementSuggestionService.getStateImprovements(
                    ctrl.states, ctrl.stateStats));

                ctrl.highlightStates = {};
                improvementSuggestions.forEach(item => {
                  // TODO(bhenning): This is the feedback for improvement
                  // types and should be included with the definitions of the
                  // improvement types.
                  if (item.type === IMPROVE_TYPE_INCOMPLETE) {
                    ctrl.highlightStates[item.stateName] = 'May be confusing';
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

          ctrl.onClickStateInStatsGraph = stateName => {
            if (!ctrl.stateStatsModalIsOpen) {
              ctrl.stateStatsModalIsOpen = true;
              ctrl.showStateStatsModal(
                stateName, ctrl.highlightStates[stateName]);
            }
          };

          ctrl.showStateStatsModal = (stateName, improvementType) => {
            const state = ExplorationStatesService.getState(stateName);
            AlertsService.clearWarnings();

            Promise.all([
              loadLatestExploration(),
              StateInteractionStatsService.computeStats(state),
            ]).then(response => {
              const stats = response[1];
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/exploration-editor-page/statistics-tab/templates/' +
                  'state-stats-modal.template.html'),
                backdrop: true,
                resolve: {
                  customizationArgs: (
                    () => Object.entries(state.interaction.customizationArgs)),
                  improvementType: () => improvementType,
                  stateName: () => stateName,
                  stateStats: () => ctrl.stateStats[stateName],
                  visualizationsInfo: () => stats.visualizations_info,
                },
                controller: [
                  '$controller', '$scope', '$uibModalInstance', '$filter',
                  'customizationArgs', 'stateName', 'stateStats',
                  'improvementType', 'visualizationsInfo', 'HtmlEscaperService',
                  function(
                      $controller, $scope, $uibModalInstance, $filter,
                      customizationArgs, stateName, stateStats,
                      improvementType, visualizationsInfo, HtmlEscaperService) {
                    $controller('ConfirmOrCancelModalController', {
                      $scope: $scope,
                      $uibModalInstance: $uibModalInstance,
                    });

                    $scope.stateName = stateName;
                    $scope.stateStats = stateStats;
                    $scope.improvementType = improvementType;

                    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS1 = (
                      newCompletionRatePieChartOptions(
                        'Answer feedback statistics'));

                    $scope.COMPLETION_RATE_PIE_CHART_OPTIONS2 = (
                      newCompletionRatePieChartOptions(
                        'Solution usage statistics'));

                    const usefulFeedbackCount = (
                      $scope.stateStats.useful_feedback_count);
                    const totalAnswersCount = (
                      $scope.stateStats.total_answers_count);
                    const numTimesSolutionViewed = (
                      $scope.stateStats.num_times_solution_viewed);

                    if (totalAnswersCount > 0) {
                      $scope.hasExplorationBeenAnswered = true;
                    }

                    $scope.pieChartData1 = [
                      ['Type', 'Number'],
                      ['Default feedback',
                        totalAnswersCount - usefulFeedbackCount],
                      ['Specific feedback', usefulFeedbackCount],
                    ];

                    $scope.pieChartData2 = [
                      ['Type', 'Number'],
                      ['Solutions used to answer', numTimesSolutionViewed],
                      ['Solutions not used',
                        totalAnswersCount - numTimesSolutionViewed]
                    ];

                    $scope.visualizationsHtml = visualizationsInfo.map(info => {
                        const visualizationElement = $(
                          '<oppia-visualization-' +
                          $filter('camelCaseToHyphens')(info.id) + '/>');

                        const addAttr = (key, val) => visualizationElement.attr(
                          $filter('camelCaseToHyphens')(key),
                          HtmlEscaperService.objToEscapedJson(val));

                        addAttr('escapedData', info.data);
                        addAttr('escapedOptions', info.options);
                        addAttr(
                          'addressedInfoIsSupported',
                          info.addressed_info_is_supported);
                        customizationArgs.forEach(argDefinition => {
                          const [name, arg] = argDefinition;
                          addAttr(name + 'WithValue', arg.value);
                        });

                        return visualizationElement.get(0).outerHTML;
                      }).join('');

                    $scope.navigateToStateEditor = () => {
                      $scope.cancel();
                      RouterService.navigateToMainTab(stateName);
                    };

                    $scope.$on('$destroy', () => {
                      ctrl.stateStatsModalIsOpen = false;
                    });
                  }
                ]
              }).result.then(() => {}, () => AlertsService.clearWarnings());
            });
          };

          ctrl.$onInit = () => {
            $scope.$on(
              'refreshStatisticsTab', ctrl.refreshExplorationStatistics);

            ctrl.COMPLETION_RATE_PIE_CHART_OPTIONS = (
              newCompletionRatePieChartOptions(''));
            ctrl.COMPLETION_RATE_CHART_OPTIONS = {
              chartAreaWidth: 300,
              colors: ['green', 'firebrick'],
              height: 100,
              legendPosition: 'right',
              width: 500
            };

            ctrl.explorationHasBeenVisited = false;
            ctrl.hasTabLoaded = false;
            ctrl.stateStatsModalIsOpen = false;
          };
        }
      ]
    };
  }]);
