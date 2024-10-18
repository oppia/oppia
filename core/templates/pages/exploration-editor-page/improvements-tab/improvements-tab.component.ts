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
 * @fileoverview Component for the improvements tab of the exploration editor.
 * @requires ExplorationImprovementsService.isImprovementsTabEnabledAsync() to
 *  have returned true. The component should be disabled by an ngIf until then.
 */

import {Component, OnInit} from '@angular/core';
import {HighBounceRateTask} from 'domain/improvements/high-bounce-rate-task.model';
import {ImprovementsConstants} from 'domain/improvements/improvements.constants';
import {IneffectiveFeedbackLoopTask} from 'domain/improvements/ineffective-feedback-loop-task.model';
import {NeedsGuidingResponsesTask} from 'domain/improvements/needs-guiding-response-task.model';
import {SuccessiveIncorrectAnswersTask} from 'domain/improvements/successive-incorrect-answers-task.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {
  ExplorationImprovementsTaskRegistryService,
  StateTasks,
} from 'services/exploration-improvements-task-registry.service';
import {RouterService} from '../services/router.service';

@Component({
  selector: 'oppia-improvements-tab',
  templateUrl: './improvements-tab.component.html',
})
export class ImprovementsTabComponent implements OnInit {
  stateRetentions: Map<string, number>;
  stateVisibility: Map<string, boolean>;
  timeMachineImageUrl: string;
  completionRate: number;
  completionRateAsPercent: string;
  hbrTasks: HighBounceRateTask[];
  iflTasks: IneffectiveFeedbackLoopTask[];
  ngrTasks: NeedsGuidingResponsesTask[];
  siaTasks: SuccessiveIncorrectAnswersTask[];
  allStateTasks: StateTasks[];

  constructor(
    private explorationImprovementsTaskRegistryService: ExplorationImprovementsTaskRegistryService,
    private routerService: RouterService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  navigateToStateEditor(stateName: string): void {
    this.routerService.navigateToMainTab(stateName);
  }

  getNumTasks(): number {
    return (
      this.hbrTasks.length +
      this.iflTasks.length +
      this.ngrTasks.length +
      this.siaTasks.length
    );
  }

  getNumExpLevelTasks(): number {
    return this.hbrTasks.length;
  }

  getNumConceptLevelTasks(): number {
    return this.iflTasks.length;
  }

  getNumCardLevelTasks(): number {
    return this.ngrTasks.length + this.siaTasks.length;
  }

  hasCriticalTasks(): boolean {
    return this.ngrTasks.length > 0;
  }

  getExplorationHealth(): string {
    if (this.hasCriticalTasks()) {
      return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_CRITICAL;
    } else if (this.getNumTasks() > 0) {
      return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_WARNING;
    } else {
      return ImprovementsConstants.EXPLORATION_HEALTH_TYPE_HEALTHY;
    }
  }

  getNumCardLevelTasksForState(stateName: string): number {
    const stateTasks =
      this.explorationImprovementsTaskRegistryService.getStateTasks(stateName);
    const ngrTask = stateTasks.ngrTask;
    const siaTask = stateTasks.siaTask;
    return (ngrTask.isOpen() ? 1 : 0) + (siaTask.isOpen() ? 1 : 0);
  }

  isStateTasksVisible(stateName: string): boolean {
    return this.stateVisibility.get(stateName);
  }

  toggleStateTasks(stateName: string): Map<string, boolean> {
    return this.stateVisibility.set(
      stateName,
      !this.stateVisibility.get(stateName)
    );
  }

  getStateRetentionPercent(stateName: string): string {
    return this.stateRetentions.get(stateName) + '%';
  }

  ngOnInit(): void {
    this.timeMachineImageUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/time_machine.svg'
    );

    const expStats =
      this.explorationImprovementsTaskRegistryService.getExplorationStats();

    this.completionRate =
      expStats && expStats.numStarts > 0
        ? expStats.numCompletions / expStats.numStarts
        : 0;

    this.completionRateAsPercent =
      Math.round(100.0 * this.completionRate) + '%';

    this.hbrTasks =
      this.explorationImprovementsTaskRegistryService.getOpenHighBounceRateTasks();
    this.iflTasks =
      this.explorationImprovementsTaskRegistryService.getOpenIneffectiveFeedbackLoopTasks();
    this.ngrTasks =
      this.explorationImprovementsTaskRegistryService.getOpenNeedsGuidingResponsesTasks();
    this.siaTasks =
      this.explorationImprovementsTaskRegistryService.getOpenSuccessiveIncorrectAnswersTasks();

    this.allStateTasks =
      this.explorationImprovementsTaskRegistryService.getAllStateTasks();

    const namesOfStatesWithTasks = this.allStateTasks.map(
      stateTasks => stateTasks.stateName
    );

    this.stateRetentions = new Map(
      namesOfStatesWithTasks.map(stateName => {
        const stateStats = expStats.getStateStats(stateName);
        const numCompletions = stateStats.numCompletions;
        const totalHitCount = stateStats.totalHitCount;
        const retentionRate = Math.round(
          totalHitCount ? (100.0 * numCompletions) / totalHitCount : 0
        );
        return [stateName, retentionRate];
      })
    );

    this.stateVisibility = new Map(
      namesOfStatesWithTasks.map(stateName => [stateName, true])
    );
  }
}
