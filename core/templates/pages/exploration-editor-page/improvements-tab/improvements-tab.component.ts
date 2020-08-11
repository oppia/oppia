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
require('services/exploration-improvements.service.ts');
require('services/exploration-improvements-task-registry.service.ts');

angular.module('oppia').component('improvementsTab', {
  template: require('./improvements-tab.component.html'),
  controller: [
    '$q', 'ExplorationImprovementsService',
    'ExplorationImprovementsTaskRegistryService', 'UrlInterpolationService',
    function(
        $q, ExplorationImprovementsService,
        ExplorationImprovementsTaskRegistryService, UrlInterpolationService) {
      this.$onInit = () => {
        this.timeMachineImageUrl = (
          UrlInterpolationService.getStaticImageUrl('/icons/time_machine.svg'));

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

            this.getCompletionRate = () => {
              return expStats && expStats.numStarts > 0 ?
                expStats.numCompletions / expStats.numStarts : 0;
            };
            this.getCompletionRateAsPercent = () => (
              Math.round(100.0 * this.getCompletionRate()) + '%');

            this.getNumTasksPending = () => (
              hbrTasks.length + iflTasks.length + ngrTasks.length +
              siaTasks.length);
            this.getExpLevelTasks = () => hbrTasks;
            this.getConceptLevelTasks = () => iflTasks;
            this.getCardLevelTasks = () => [...ngrTasks, ...siaTasks];

            this.getExplorationHealth = () => {
              if (ngrTasks.length > 0) {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_CRITICAL;
              } else if (this.getNumTasksPending() > 0) {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_WARNING;
              } else {
                return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_HEALTHY;
              }
            };

            this.isInitialized = true;
          });
      };
    },
  ],
});
