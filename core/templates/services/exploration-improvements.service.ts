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
 * @fileoverview Service responsible for coordinating the retrieval and storage
 * of data related to exploration improvement tasks.
 */

import { merge } from 'd3-array';

import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
import { HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';

require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('services/context.service.ts');
require('services/exploration-improvements-backend-api.service.ts');
require('services/exploration-improvements-task-registry.service.ts');
require('services/exploration-stats.service.ts');
require('services/playthrough-issues.service.ts');
require('services/state-top-answers-stats.service.ts');

angular.module('oppia').factory('ExplorationImprovementsService', [
  'ContextService', 'ExplorationImprovementsBackendApiService',
  'ExplorationImprovementsTaskRegistryService', 'ExplorationRightsService',
  'ExplorationStatesService', 'ExplorationStatsService',
  'PlaythroughIssuesService', 'StateTopAnswersStatsService',
  'UserExplorationPermissionsService',
  function(
      ContextService, ExplorationImprovementsBackendApiService,
      ExplorationImprovementsTaskRegistryService, ExplorationRightsService,
      ExplorationStatesService, ExplorationStatsService,
      PlaythroughIssuesService, StateTopAnswersStatsService,
      UserExplorationPermissionsService) {
    /** @private */
    let initializationHasStarted: boolean;
    /** @private */
    let resolveInitPromise: () => void;
    /** @private */
    let rejectInitPromise: (_) => void;
    /** @private */
    const initPromise: Promise<void> = new Promise((resolve, reject) => {
      resolveInitPromise = resolve;
      rejectInitPromise = reject;
    });

    /** @private */
    let openHbrTasks: HighBounceRateTask[] = [];
    let ngrTasksOpenSinceInit: NeedsGuidingResponsesTask[] = [];

    /** @private */
    let config: ExplorationImprovementsConfig;
    /** @private */
    let improvementsTabIsAccessible: boolean;
    /** @private */
    const doInitAsync = async() => {
      const expId = ContextService.getExplorationId();
      const userPermissions = (
        await UserExplorationPermissionsService.getPermissionsAsync());

      improvementsTabIsAccessible = (
        ExplorationRightsService.isPublic() && userPermissions.canEdit);

      if (!improvementsTabIsAccessible) {
        return;
      }

      config = (
        await ExplorationImprovementsBackendApiService.getConfigAsync(expId));

      if (!config.improvementsTabIsEnabled) {
        return;
      }

      PlaythroughIssuesService.initSession(expId, config.explorationVersion);

      const states = ExplorationStatesService.getStates();
      const expStats = (
        await ExplorationStatsService.getExplorationStats(expId));
      const {openTasks, resolvedTaskTypesByStateName} = (
        await ExplorationImprovementsBackendApiService.getTasksAsync(expId));
      const topAnswersByStateName = (
        await StateTopAnswersStatsService.getTopAnswersByStateNameAsync());
      const playthroughIssues = await PlaythroughIssuesService.getIssues();

      openHbrTasks = (
        openTasks.filter(t => t.taskType === 'high_bounce_rate'));
      ngrTasksOpenSinceInit = (
        openTasks.filter(t => t.taskType === 'needs_guiding_responses'));

      await ExplorationImprovementsTaskRegistryService.initialize(
        config, states, expStats, openTasks, resolvedTaskTypesByStateName,
        topAnswersByStateName, playthroughIssues);
    };

    return {
      initAsync(): Promise<void> {
        if (!initializationHasStarted) {
          initializationHasStarted = true;
          doInitAsync().then(resolveInitPromise, rejectInitPromise);
        }
        return initPromise;
      },

      async flushUpdatedTasksToBackend(): Promise<void> {
        const openHbrTasksRemaining = (
          ExplorationImprovementsTaskRegistryService
            .getOpenHighBounceRateTasks());
        await ExplorationImprovementsBackendApiService.postTasksAsync(
          config.explorationId,
          merge([
            openHbrTasks.filter(t => t.isObsolete()),
            ngrTasksOpenSinceInit.filter(t => t.isResolved()),
            openHbrTasksRemaining.filter(t => !openHbrTasks.includes(t)),
          ]));
        openHbrTasks = openHbrTasksRemaining;
        ngrTasksOpenSinceInit = ngrTasksOpenSinceInit.filter(t => t.isOpen());
      },

      async isImprovementsTabEnabledAsync(): Promise<boolean> {
        await initPromise;
        return improvementsTabIsAccessible && config.improvementsTabIsEnabled;
      },
    };
  },
]);
