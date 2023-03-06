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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { merge } from 'd3-array';
import { ExplorationImprovementsConfig } from 'domain/improvements/exploration-improvements-config.model';
import { HighBounceRateTask } from 'domain/improvements/high-bounce-rate-task.model';
import { NeedsGuidingResponsesTask } from 'domain/improvements/needs-guiding-response-task.model';
import { State } from 'domain/state/StateObjectFactory';
import { ExplorationRightsService } from 'pages/exploration-editor-page/services/exploration-rights.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { ContextService } from 'services/context.service';
import { ExplorationImprovementsBackendApiService } from 'services/exploration-improvements-backend-api.service';
import { ExplorationImprovementsTaskRegistryService } from 'services/exploration-improvements-task-registry.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { PlaythroughIssuesService } from 'services/playthrough-issues.service';
import { ExplorationTaskType } from 'domain/improvements/exploration-task.model';

@Injectable({
  providedIn: 'root'
})
export class ExplorationImprovementsService {
  // These properties are initialized using int method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  initializationHasStarted!: boolean;
  openHbrTasks!: HighBounceRateTask[];
  ngrTasksOpenSinceInit!: NeedsGuidingResponsesTask[];
  config!: ExplorationImprovementsConfig;
  improvementsTabIsAccessible!: boolean;
  initPromise!: Promise<void>;
  resolveInitPromise!: () => void;
  rejectInitPromise!: () => void;

  constructor(
    private explorationRightsService: ExplorationRightsService,
    private explorationStatesService: ExplorationStatesService,
    private userExplorationPermissionsService:
      UserExplorationPermissionsService,
    private contextService: ContextService,
    private explorationImprovementsBackendApiService:
      ExplorationImprovementsBackendApiService,
    private explorationImprovementsTaskRegistryService:
      ExplorationImprovementsTaskRegistryService,
    private explorationStatsService: ExplorationStatsService,
    private stateTopAnswersStatsService: StateTopAnswersStatsService,
    private playthroughIssuesService: PlaythroughIssuesService,
  ) {
    this.openHbrTasks = [];
    this.ngrTasksOpenSinceInit = [];
    this.initPromise = new Promise((resolve, reject) => {
      this.resolveInitPromise = resolve;
      this.rejectInitPromise = reject;
    });
  }

  async initAsync(): Promise<void> {
    if (!this.initializationHasStarted) {
      this.initializationHasStarted = true;
      this.doInitAsync().then(this.resolveInitPromise, this.rejectInitPromise);
    }

    return this.initPromise;
  }

  async flushUpdatedTasksToBackend(): Promise<void> {
    if (!await this.isImprovementsTabEnabledAsync()) {
      return;
    }

    const hbrTasksStillOpen = (
      this.explorationImprovementsTaskRegistryService
        .getOpenHighBounceRateTasks());

    await this.explorationImprovementsBackendApiService.postTasksAsync(
      this.config.explorationId,
      merge([
        this.openHbrTasks.filter(t => t.isObsolete()),
        hbrTasksStillOpen.filter(t => !this.openHbrTasks.includes(t)),
        this.ngrTasksOpenSinceInit.filter(t => t.isResolved()),
      ]));

    this.openHbrTasks = hbrTasksStillOpen;
    this.ngrTasksOpenSinceInit =
      this.ngrTasksOpenSinceInit.filter(t => t.isOpen());
  }

  async isImprovementsTabEnabledAsync(): Promise<boolean> {
    await this.initAsync();

    return (
      this.improvementsTabIsAccessible &&
      this.config.improvementsTabIsEnabled);
  }

  async doInitAsync(): Promise<void> {
    const userPermissions = (
      await this.userExplorationPermissionsService.getPermissionsAsync());

    this.improvementsTabIsAccessible = (
      this.explorationRightsService.isPublic() && userPermissions.canEdit);

    if (!this.improvementsTabIsAccessible) {
      return;
    }

    const expId = this.contextService.getExplorationId();
    this.config = (
      await this.explorationImprovementsBackendApiService
        .getConfigAsync(expId));

    if (!this.config.improvementsTabIsEnabled) {
      return;
    }

    this.playthroughIssuesService
      .initSession(expId, this.config.explorationVersion);

    const states = this.explorationStatesService.getStates();
    const expStats = (
      await this.explorationStatsService.getExplorationStatsAsync(expId));
    const {openTasks, resolvedTaskTypesByStateName} = (
      await this.explorationImprovementsBackendApiService.getTasksAsync(expId));
    const topAnswersByStateName = (
      await this.stateTopAnswersStatsService.getTopAnswersByStateNameAsync(
        expId, states));
    const playthroughIssues = await this.playthroughIssuesService.getIssues();

    this.openHbrTasks = (
      openTasks.filter(t => t.taskType === 'high_bounce_rate') as
      HighBounceRateTask[]);

    this.explorationImprovementsTaskRegistryService.initialize(
      this.config, states, expStats, openTasks,
      resolvedTaskTypesByStateName as
      Map<string, ExplorationTaskType[]>,
      topAnswersByStateName, playthroughIssues);

    this.ngrTasksOpenSinceInit = (
      this.explorationImprovementsTaskRegistryService
        .getOpenNeedsGuidingResponsesTasks());

    this.explorationStatesService.registerOnStateAddedCallback(
      (stateName: string) => {
        this.explorationImprovementsTaskRegistryService.onStateAdded(stateName);
      });

    this.explorationStatesService.registerOnStateDeletedCallback(
      (stateName: string) => {
        this.explorationImprovementsTaskRegistryService
          .onStateDeleted(stateName);
      });

    this.explorationStatesService.registerOnStateRenamedCallback(
      (oldName: string, newName: string) => {
        this.explorationImprovementsTaskRegistryService.onStateRenamed(
          oldName, newName);
      });

    this.explorationStatesService.registerOnStateInteractionSavedCallback(
      (state: State) => {
        this.explorationImprovementsTaskRegistryService.onStateInteractionSaved(
          state);
      });
  }
}

angular.module('oppia').factory('ExplorationImprovementsService',
  downgradeInjectable(ExplorationImprovementsService));
