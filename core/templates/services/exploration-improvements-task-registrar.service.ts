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
 * @fileoverview Registrar responsible for managing the improvements tasks of an
 * exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { merge } from 'd3-array';
import { sortBy } from 'lodash';

import { AnswerStats } from 'domain/exploration/AnswerStatsObjectFactory';
import {
  CyclicStateTransitionsPlaythrough,
  EarlyQuitPlaythrough,
  MultipleIncorrectSubmissionsPlaythrough,
  Playthrough,
} from 'domain/statistics/PlaythroughObjectFactory';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';
import {
  ExplorationTask,
  ExplorationTaskObjectFactory,
  ExplorationTaskType,
} from 'domain/improvements/ExplorationTaskObjectFactory';
import { HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { ITaskEntryPayloadDict } from
  'domain/improvements/TaskEntryObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/IneffectiveFeedbackLoopTaskObjectFactory';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import { States } from 'domain/exploration/StatesObjectFactory';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';

type HbrTask = HighBounceRateTask;
type IflTask = IneffectiveFeedbackLoopTask;
type NgrTask = NeedsGuidingResponsesTask;
type SiaTask = SuccessiveIncorrectAnswersTask;
type CstPlaythrough = CyclicStateTransitionsPlaythrough;
type EqPlaythrough = EarlyQuitPlaythrough;
type MisPlaythrough = MultipleIncorrectSubmissionsPlaythrough;

class TaskRegistry {
  public readonly hbrTask: HbrTask;
  public readonly iflTask: IflTask;
  public readonly ngrTask: NgrTask;
  public readonly siaTask: SiaTask;

  public readonly initialHbrTaskStatus: string;
  public readonly ngrTaskWasInitiallyOpen: boolean;

  constructor(tasks: ExplorationTask[]) {
    const [hbrTask, iflTask, ngrTask, siaTask] = sortBy(tasks, t => t.taskType);
    this.hbrTask = <HighBounceRateTask> hbrTask;
    this.initialHbrTaskStatus = hbrTask.getStatus();
    this.iflTask = <IneffectiveFeedbackLoopTask> iflTask;
    this.ngrTask = <NeedsGuidingResponsesTask> ngrTask;
    this.ngrTaskWasInitiallyOpen = ngrTask.isOpen();
    this.siaTask = <SuccessiveIncorrectAnswersTask> siaTask;
  }

  public forEach(fn: (t: ExplorationTask) => void): void {
    fn(this.hbrTask);
    fn(this.iflTask);
    fn(this.ngrTask);
    fn(this.siaTask);
  }

  public map(fn: (t: ExplorationTask) => ExplorationTask): TaskRegistry {
    return new TaskRegistry([
      fn(this.hbrTask), fn(this.iflTask), fn(this.ngrTask), fn(this.siaTask),
    ]);
  }

  public didHbrTaskStatusChange(): boolean {
    return this.initialHbrTaskStatus !== this.hbrTask.getStatus();
  }
}

class StatsRegistry {
  public answerStats: AnswerStats[] = [];
  public cstPlaythroughs: CstPlaythrough[] = [];
  public eqPlaythroughs: EqPlaythrough[] = [];
  public misPlaythroughs: MisPlaythrough[] = [];
}

@Injectable({providedIn: 'root'})
export class ExplorationImprovementsTaskRegistrarService {
  private expId: string;
  private expVersion: number;
  private expStats: ExplorationStats;

  private taskRegistry: Map<string, TaskRegistry> = new Map();
  private statsRegistry: Map<string, StatsRegistry> = new Map();

  private tasksByType: Map<ExplorationTaskType, ExplorationTask[]> = (
    new Map(ImprovementsConstants.TASK_TYPES.map(t => [t, []])));

  private initializationChangesAreFlushed: boolean = false;

  constructor(
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory) {}

  initialize(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>) {
    this.validateInitializeArgs(
      expId, expVersion, states, expStats, openTasks,
      resolvedTaskTypesByStateName, stateAnswerStats,
      cstPlaythroughsByStateName, eqPlaythroughsByStateName,
      misPlaythroughsByStateName);

    this.expId = expId;
    this.expVersion = expVersion;
    this.expStats = expStats;

    const allStateNames = states.getStateNames();
    this.initializeStatsRegistry(
      allStateNames, stateAnswerStats, cstPlaythroughsByStateName,
      eqPlaythroughsByStateName, misPlaythroughsByStateName);
    this.initializeTaskRegistry(
      allStateNames, openTasks, resolvedTaskTypesByStateName);

    for (const [stateName, taskRegistry] of this.taskRegistry.entries()) {
      const statsRegistry = this.statsRegistry.get(stateName);
      taskRegistry.forEach(t => this.refreshTask(t, statsRegistry));
    }
  }

  flushInitializationChanges(): ITaskEntryPayloadDict[] {
    if (this.initializationChangesAreFlushed) {
      return [];
    }
    this.initializationChangesAreFlushed = true;

    const payload = [];
    for (const taskRegistry of this.taskRegistry.values()) {
      if (taskRegistry.didHbrTaskStatusChange()) {
        payload.push(taskRegistry.hbrTask.toPayloadDict());
      }
    }
    return payload;
  }

  onStateAdd(stateName: string): void {
    const newTasks = ImprovementsConstants.TASK_TYPES.map(
      taskType => this.explorationTaskObjectFactory.createNewObsoleteTask(
        this.expId, this.expVersion, taskType, stateName));
    this.taskRegistry.set(stateName, new TaskRegistry(newTasks));
    this.statsRegistry.set(stateName, new StatsRegistry());
    newTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
  }

  onStateDelete(stateName: string): void {
    const taskRegistry = this.taskRegistry.get(stateName);
    taskRegistry.forEach(t => t.markAsObsolete());

    // eslint-disable-next-line dot-notation
    this.taskRegistry.delete(stateName);
    // eslint-disable-next-line dot-notation
    this.statsRegistry.delete(stateName);
  }

  onStateRename(oldStateName: string, newStateName: string): void {
    const oldTaskRegistry = this.taskRegistry.get(oldStateName);
    const newTaskRegistry = (
      oldTaskRegistry.map(t => t.cloneWithNewTarget(newStateName)));

    newTaskRegistry.forEach(t => this.tasksByType.get(t.taskType).push(t));
    oldTaskRegistry.forEach(t => t.markAsObsolete());

    // eslint-disable-next-line dot-notation
    this.taskRegistry.delete(oldStateName);
    // eslint-disable-next-line dot-notation
    this.statsRegistry.delete(oldStateName);

    this.taskRegistry.set(newStateName, newTaskRegistry);
    this.statsRegistry.set(newStateName, new StatsRegistry());
  }

  onChangeAnswerGroups(stateName: string): void {
    const {ngrTask} = this.taskRegistry.get(stateName);
    this.refreshTask(ngrTask, this.statsRegistry.get(stateName));
  }

  getHighBounceRateTasks(): HbrTask[] {
    return <HbrTask[]> this.tasksByType.get('high_bounce_rate');
  }

  getIneffectiveFeedbackLoopTasks(): IflTask[] {
    return <IflTask[]> this.tasksByType.get('ineffective_feedback_loop');
  }

  getNeedsGuidingResponsesTasks(): NgrTask[] {
    return <NgrTask[]> this.tasksByType.get('needs_guiding_responses');
  }

  getSuccessiveIncorrectAnswersTasks(): SiaTask[] {
    return <SiaTask[]> this.tasksByType.get('successive_incorrect_answers');
  }

  private refreshTask(
      task: ExplorationTask, statsRegistry: StatsRegistry): void {
    switch (task.taskType) {
      case 'high_bounce_rate':
        task.refreshStatus(this.expStats, statsRegistry.eqPlaythroughs.length);
        break;
      case 'ineffective_feedback_loop':
        task.refreshStatus(statsRegistry.cstPlaythroughs.length);
        break;
      case 'needs_guiding_responses':
        task.refreshStatus(statsRegistry.answerStats);
        break;
      case 'successive_incorrect_answers':
        task.refreshStatus(statsRegistry.misPlaythroughs.length);
        break;
    }
  }

  private validateInitializeArgs(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>): void {
    if (expStats.expId !== expId) {
      throw new Error(
        'Expected stats for exploration "' + expId + '", but got stats for ' +
        'exploration "' + expStats.expId + '"');
    }
    if (expStats.expVersion !== expVersion) {
      throw new Error(
        'Expected stats for exploration version ' + expVersion + ', but got ' +
        'stats for exploration version ' + expStats.expVersion);
    }

    const actualStateNames = new Set<string>(states.getStateNames());
    const referencedStateNames = new Set<string>([
      ...openTasks.map(t => t.targetId),
      ...resolvedTaskTypesByStateName.keys(),
      ...stateAnswerStats.keys(),
      ...cstPlaythroughsByStateName.keys(),
      ...eqPlaythroughsByStateName.keys(),
      ...misPlaythroughsByStateName.keys(),
    ]);
    for (const stateName of referencedStateNames) {
      if (!actualStateNames.has(stateName)) {
        throw new Error(
          'Unexpected reference to state "' + stateName + '", which does not ' +
          'exist');
      }
    }

    const allPlaythroughs = merge<Playthrough>([
      ...cstPlaythroughsByStateName.values(),
      ...eqPlaythroughsByStateName.values(),
      ...misPlaythroughsByStateName.values(),
    ]);
    for (const playthrough of allPlaythroughs) {
      if (playthrough.expId !== expId) {
        throw new Error(
          'Expected playthrough for exploration "' + expId + '", but got ' +
          'playthrough for exploration "' + playthrough.expId + '"');
      }
      if (playthrough.expVersion !== expVersion) {
        throw new Error(
          'Expected playthrough for exploration version ' + expVersion + ', ' +
          'but got playthrough for exploration version ' +
          playthrough.expVersion);
      }
    }

    const stateNameReferencesByTaskType = new Map(
      ImprovementsConstants.TASK_TYPES.map(taskType => [taskType, new Set()]));

    for (const task of openTasks) {
      if (task.entityId !== expId) {
        throw new Error(
          'Expected task for exploration "' + expId + '", but got task for ' +
          'exploration "' + task.entityId + '"');
      }
      if (task.entityVersion !== expVersion) {
        throw new Error(
          'Expected task for exploration version ' + expVersion + ', but got ' +
          'task for exploration version ' + task.entityVersion);
      }
      const {taskType, targetId: stateName} = task;
      const stateNameReferences = stateNameReferencesByTaskType.get(taskType);
      if (stateNameReferences.has(task.targetId)) {
        throw new Error(
          'Found duplicate task of type "' + taskType + '" targeting state ' +
          '"' + stateName + '"');
      } else {
        stateNameReferences.add(task.targetId);
      }
    }

    for (const stateName of resolvedTaskTypesByStateName.keys()) {
      for (const taskType of resolvedTaskTypesByStateName.get(stateName)) {
        const stateNameReferences = stateNameReferencesByTaskType.get(taskType);
        if (stateNameReferences.has(stateName)) {
          throw new Error(
            'Found duplicate task of type "' + taskType + '" targeting state ' +
            '"' + stateName + '"');
        } else {
          stateNameReferences.add(stateName);
        }
      }
    }
  }

  private initializeStatsRegistry(
      allStateNames: string[],
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>): void {
    for (const stateName of allStateNames) {
      const newStatsRegistry = new StatsRegistry();
      if (stateAnswerStats.has(stateName)) {
        newStatsRegistry.answerStats = stateAnswerStats.get(stateName);
      }
      if (cstPlaythroughsByStateName.has(stateName)) {
        newStatsRegistry.cstPlaythroughs = (
          cstPlaythroughsByStateName.get(stateName));
      }
      if (eqPlaythroughsByStateName.has(stateName)) {
        newStatsRegistry.eqPlaythroughs = (
          eqPlaythroughsByStateName.get(stateName));
      }
      if (misPlaythroughsByStateName.has(stateName)) {
        newStatsRegistry.misPlaythroughs = (
          misPlaythroughsByStateName.get(stateName));
      }
      this.statsRegistry.set(stateName, newStatsRegistry);
    }
  }

  private initializeTaskRegistry(
      allStateNames: string[],
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>): void {
    // Intermediate data structure for mapping state names to their tasks.
    const tasksByStateName = new Map<string, ExplorationTask[]>(
      allStateNames.map(stateName => [stateName, []]));

    const missingTaskTypesByStateName = (
      new Map<string, Set<ExplorationTaskType>>(allStateNames.map(
        stateName => [stateName, new Set(ImprovementsConstants.TASK_TYPES)])));

    // Register each of the predefined open tasks.
    for (const task of openTasks) {
      tasksByStateName.get(task.targetId).push(task);
      this.tasksByType.get(task.taskType).push(task);
      // eslint-disable-next-line dot-notation
      missingTaskTypesByStateName.get(task.targetId).delete(task.taskType);
    }

    // Register each of the predefined resolved tasks.
    for (const stateName of resolvedTaskTypesByStateName.keys()) {
      for (const taskType of resolvedTaskTypesByStateName.get(stateName)) {
        const newTask = this.explorationTaskObjectFactory.createNewResolvedTask(
          this.expId, this.expVersion, taskType, stateName);
        tasksByStateName.get(stateName).push(newTask);
        this.tasksByType.get(taskType).push(newTask);
        // eslint-disable-next-line dot-notation
        missingTaskTypesByStateName.get(stateName).delete(taskType);
      }
    }

    // Fill any missing task types with an obsolete place holder.
    for (const stateName of missingTaskTypesByStateName.keys()) {
      for (const taskType of missingTaskTypesByStateName.get(stateName)) {
        const newTask = this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.expId, this.expVersion, taskType, stateName);
        tasksByStateName.get(stateName).push(newTask);
        this.tasksByType.get(taskType).push(newTask);
      }
    }

    // Finally, construct the registry with the completed set of tasks. Each set
    // of tasks is expected to be "complete", that is, to have every type of
    // task present.
    for (const [stateName, tasks] of tasksByStateName.entries()) {
      this.taskRegistry.set(stateName, new TaskRegistry(tasks));
    }
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistrarService',
  downgradeInjectable(ExplorationImprovementsTaskRegistrarService));
