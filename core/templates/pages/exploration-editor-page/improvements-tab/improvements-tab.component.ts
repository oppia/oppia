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
 * @requires ExplorationImprovementsService.isImprovementsTabEnabledAsync() to
 *  have returned true. The component should be disabled by an ngIf until then.
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
    'ExplorationImprovementsTaskRegistryService', 'RouterService',
    'UrlInterpolationService',
    function(
        ExplorationImprovementsTaskRegistryService, RouterService,
        UrlInterpolationService) {
      this.$onInit = () => {
        this.timeMachineImageUrl = (
          UrlInterpolationService.getStaticImageUrl('/icons/time_machine.svg'));
        this.navigateToStateEditor = (stateName: string) => {
          RouterService.navigateToMainTab(stateName);
        };

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
        this.getNumCardLevelTasksForState = (stateName: string) => {
          const stateTasks = (
            ExplorationImprovementsTaskRegistryService.getStateTasks(
              stateName));
          const ngrTask = stateTasks.ngrTask;
          const siaTask = stateTasks.siaTask;
          return (ngrTask.isOpen() ? 1 : 0) + (siaTask.isOpen() ? 1 : 0);
        };

        this.allStateTasks = (
          ExplorationImprovementsTaskRegistryService.getAllStateTasks());
        const namesOfStatesWithTasks = (
          this.allStateTasks.map(stateTasks => stateTasks.stateName));

        const stateRetentions: Map<string, number> = (
          new Map(namesOfStatesWithTasks.map(stateName => {
            const stateStats = expStats.getStateStats(stateName);
            const numCompletions = stateStats.numCompletions;
            const totalHitCount = stateStats.totalHitCount;
            const retentionRate = Math.round(
              totalHitCount ? (100.0 * numCompletions / totalHitCount) : 0);
            return [stateName, retentionRate];
          })));

        this.getStateRetentionPercent = (stateName: string) => (
          stateRetentions.get(stateName) + '%');

        const stateVisibility: Map<string, boolean> = (
          new Map(namesOfStatesWithTasks.map(stateName => [stateName, true])));

        this.isStateTasksVisible = (stateName: string) => (
          stateVisibility.get(stateName));
        this.toggleStateTasks = (stateName: string) => (
          stateVisibility.set(stateName, !stateVisibility.get(stateName)));
      };
    },
  ],
});
