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
 * @fileoverview Directive for the improvements tab of the exploration editor.
 */

import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

require('components/statistics-directives/completion-graph.component.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'needs-guiding-responses-task.component.ts');
require('services/exploration-improvements.service.ts');
require('services/exploration-improvements-task-registry.service.ts');

angular.module('oppia').component('improvementsTab', {
  template: require('./improvements-tab.component.html'),
  controller: [
    '$q', 'ExplorationImprovementsService',
    'ExplorationImprovementsTaskRegistryService', 'RouterService',
    'UrlInterpolationService',
    function(
        $q, ExplorationImprovementsService,
        ExplorationImprovementsTaskRegistryService, RouterService,
        UrlInterpolationService) {
      this.$onInit = () => {
        this.isInitialized = false;
        this.timeMachineImageUrl = (
          UrlInterpolationService.getStaticImageUrl('/icons/time_machine.svg'));
        this.navigateToStateEditor = (stateName: string) => {
          RouterService.navigateToMainTab(stateName);
        };

        // AngularJS immediately refreshes directives after $q promises fulfill,
        // so we convert to one from the "plain" promise returned by the
        // service.
        $q.when(ExplorationImprovementsService.isImprovementsTabEnabledAsync())
          .then(improvementsTabIsEnabled => {
            if (!improvementsTabIsEnabled) {
              return;
            }

            const expStats = (
              ExplorationImprovementsTaskRegistryService.getExplorationStats());
            this.completionRate = (
              (expStats && expStats.numStarts > 0) ?
                (expStats.numCompletions / expStats.numStarts) : 0);
            this.completionRateAsPercent = (
              Math.round(100.0 * this.completionRate) + '%');

            const hbrTasks = (
              ExplorationImprovementsTaskRegistryService
                .getOpenHighBounceRateTasks());
            const iflTasks = (
              ExplorationImprovementsTaskRegistryService
                .getOpenIneffectiveFeedbackLoopTasks());
            const ngrTasks = (
              ExplorationImprovementsTaskRegistryService
                .getOpenNeedsGuidingResponsesTasks());
            const siaTasks = (
              ExplorationImprovementsTaskRegistryService
                .getOpenSuccessiveIncorrectAnswersTasks());
            this.getNumTasks = () => (
              hbrTasks.length + iflTasks.length + ngrTasks.length +
              siaTasks.length);
            this.getNumExpLevelTasks = () => hbrTasks.length;
            this.getNumConceptLevelTasks = () => iflTasks.length;
            this.getNumCardLevelTasks = () => ngrTasks.length + siaTasks.length;
            this.hasCriticalTasks = () => ngrTasks.length > 0;
            this.getExplorationHealth = () => {
              if (this.hasCriticalTasks()) {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_CRITICAL;
              } else if (this.getNumTasks() > 0) {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_WARNING;
              } else {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_HEALTHY;
              }
            };

            this.stateTasksDictionary = (
              ExplorationImprovementsTaskRegistryService
                .makeStateTasksDictionary());

            const stateRetentions: Map<string, number> = new Map(
              Object.keys(this.stateTasksDictionary).map(stateName => {
                const {numCompletions, totalHitCount} = (
                  expStats.getStateStats(stateName));
                const retentionRate = (
                  totalHitCount ? (numCompletions / totalHitCount) : 0);
                return [stateName, Math.round(100.0 * retentionRate)];
              }));
            this.getStateRetention = (stateName: string) => {
              return stateRetentions.get(stateName);
            };
            this.getStateNumCardLevelTasks = (stateName: string) => {
              const {ngrTask, siaTask} = this.stateTasksDictionary[stateName];
              return (ngrTask.isOpen() ? 1 : 0) + (siaTask.isOpen() ? 1 : 0);
            };

            const stateVisibility: Map<string, boolean> = new Map(
              Object.keys(this.stateTasksDictionary).map(
                stateName => [stateName, true]));
            this.isStateTasksVisible = (stateName: string) => {
              return stateVisibility.get(stateName);
            };
            this.toggleStateTasks = (stateName: string) => {
              stateVisibility.set(stateName, !stateVisibility.get(stateName));
            };

            this.isInitialized = true;
          });
      };
    },
  ],
});
