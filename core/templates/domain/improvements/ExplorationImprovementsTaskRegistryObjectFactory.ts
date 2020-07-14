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

import { merge, group } from 'd3-array';
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

class StateStats {
  constructor(
      public answerStats: AnswerStats[] = [],
      public cstPlaythroughs: CstPlaythrough[] = [],
      public eqPlaythroughs: EqPlaythrough[] = [],
      public misPlaythroughs: MisPlaythrough[] = []) {}
}

class StateTasks {
  public readonly initialHbrTaskStatus: string;
  public readonly ngrTaskWasInitiallyOpen: boolean;

  constructor(
      public readonly hbrTask: HighBounceRateTask,
      public readonly iflTask: IneffectiveFeedbackLoopTask,
      public readonly ngrTask: NeedsGuidingResponsesTask,
      public readonly siaTask: SuccessiveIncorrectAnswersTask,
      public readonly stateStats: StateStats) {
    this.initialHbrTaskStatus = hbrTask.getStatus();
    this.ngrTaskWasInitiallyOpen = ngrTask.isOpen();
  }

  public forEach(fn: <T extends ExplorationTask>(t: T) => void): void {
    fn(this.hbrTask);
    fn(this.iflTask);
    fn(this.ngrTask);
    fn(this.siaTask);
  }

  public map(fn: <T extends ExplorationTask>(t: T) => T): StateTasks {
    return new StateTasks(
      fn(this.hbrTask), fn(this.iflTask), fn(this.ngrTask), fn(this.siaTask),
      this.stateStats);
  }

  public didHbrTaskStatusChange(): boolean {
    return this.initialHbrTaskStatus !== this.hbrTask.getStatus();
  }
}

type TaskFactory = <T extends ExplorationTask>(
  stateName: string, taskType: ExplorationTaskType) => T;

export class ExplorationImprovementsTaskRegistry {
  private tasksByState: Map<string, StateTasks> = new Map();
  private tasksByType: Map<ExplorationTaskType, ExplorationTask[]> = (
    new Map(ImprovementsConstants.TASK_TYPES.map(t => [t, []])));

  private initializationChangesAreFlushed: boolean = false;

  private createNewStateTasks(
      stateName: string,
      tasks: Map<ExplorationTaskType, ExplorationTask>,
      answerStats: AnswerStats[],
      cstPlaythroughs: CstPlaythrough[],
      eqPlaythroughs: EqPlaythrough[],
      misPlaythroughs: MisPlaythrough[]): StateTasks {
    const stateStats = new StateStats(
      answerStats, cstPlaythroughs, eqPlaythroughs, misPlaythroughs);

    tasks = angular.copy(tasks);
    for (const taskType of ImprovementsConstants.TASK_TYPES) {
      if (!tasks.has(taskType)) {
      }
    }

    let hbrTask = (
      openTasks.find(t => t.taskType === 'high_bounce_rate') ||
      resolvedTasks.find(t => t.taskType == 'high_bounce_rate') ||
      obsoleteTasks.find(t => t.taskType === 'high_bounce_rate'));
  }

  constructor(
      public readonly expId: string,
      public readonly expVersion: number,
      public readonly states: States,
      public readonly expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>,
      private obsoleteTaskFactory: TaskFactory,
      private resolvedTaskFactory: TaskFactory) {
    const allStateNames = states.getStateNames();
    this.initializeStateStats(
      allStateNames, stateAnswerStats, cstPlaythroughsByStateName,
      eqPlaythroughsByStateName, misPlaythroughsByStateName);
    this.initializeStateTasks(
      allStateNames, openTasks, resolvedTaskTypesByStateName);

    this.tasksByState.forEach(stateTasks => {
      stateTasks.forEach(t => this.refreshTask(t, stateTasks.stateStats));
    });
  }

  flushInitializationChanges(): ITaskEntryPayloadDict[] {
    if (this.initializationChangesAreFlushed) {
      return [];
    }
    this.initializationChangesAreFlushed = true;

    const payload = [];
    for (const tasksByState of this.tasksByState.values()) {
      if (tasksByState.didHbrTaskStatusChange()) {
        payload.push(tasksByState.hbrTask.toPayloadDict());
      }
    }
    return payload;
  }

  onStateAdd(stateName: string): void {
    const newTasks = ImprovementsConstants.TASK_TYPES.map(
      taskType => this.explorationTaskObjectFactory.createNewObsoleteTask(
        this.expId, this.expVersion, taskType, stateName));
    this.tasksByState.set(stateName, new StateTasks(newTasks));
    this.statsByState.set(stateName, new StateStats());
    newTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
  }

  onStateDelete(stateName: string): void {
    const tasksByState = this.tasksByState.get(stateName);
    tasksByState.forEach(t => t.markAsObsolete());

    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(stateName);
    // eslint-disable-next-line dot-notation
    this.statsByState.delete(stateName);
  }

  onStateRename(oldStateName: string, newStateName: string): void {
    const oldStateTasks = this.tasksByState.get(oldStateName);
    const newStateTasks = (
      oldStateTasks.map(t => t.cloneWithNewTarget(newStateName)));

    newStateTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
    oldStateTasks.forEach(t => t.markAsObsolete());

    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(oldStateName);
    // eslint-disable-next-line dot-notation
    this.statsByState.delete(oldStateName);

    this.tasksByState.set(newStateName, newStateTasks);
    this.statsByState.set(newStateName, new StateStats());
  }

  onChangeAnswerGroups(stateName: string): void {
    const {ngrTask} = this.tasksByState.get(stateName);
    this.refreshTask(ngrTask, this.statsByState.get(stateName));
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
      task: ExplorationTask, statsByState: StateStats): void {
    switch (task.taskType) {
      case 'high_bounce_rate':
        task.refreshStatus(this.expStats, statsByState.eqPlaythroughs.length);
        break;
      case 'ineffective_feedback_loop':
        task.refreshStatus(statsByState.cstPlaythroughs.length);
        break;
      case 'needs_guiding_responses':
        task.refreshStatus(statsByState.answerStats);
        break;
      case 'successive_incorrect_answers':
        task.refreshStatus(statsByState.misPlaythroughs.length);
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

  private initializeStateStats(
      allStateNames: string[],
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>): void {
    for (const stateName of allStateNames) {
      const newStateStats = new StateStats();
      if (stateAnswerStats.has(stateName)) {
        newStateStats.answerStats = stateAnswerStats.get(stateName);
      }
      if (cstPlaythroughsByStateName.has(stateName)) {
        newStateStats.cstPlaythroughs = (
          cstPlaythroughsByStateName.get(stateName));
      }
      if (eqPlaythroughsByStateName.has(stateName)) {
        newStateStats.eqPlaythroughs = (
          eqPlaythroughsByStateName.get(stateName));
      }
      if (misPlaythroughsByStateName.has(stateName)) {
        newStateStats.misPlaythroughs = (
          misPlaythroughsByStateName.get(stateName));
      }
      this.statsByState.set(stateName, newStateStats);
    }
  }

  private initializeStateTasks(
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
    for (const [stateName, tasks] of tasksByStateName) {
      this.tasksByState.set(stateName, new StateTasks(tasks));
    }
  }
}

@Injectable({providedIn: 'root'})
export class ExplorationImprovementsTaskRegistryObjectFactory {
  constructor(
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory) {}

  createNew(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      stateAnswerStats: Map<string, AnswerStats[]>,
      cstPlaythroughsByStateName: Map<string, CstPlaythrough[]>,
      eqPlaythroughsByStateName: Map<string, EqPlaythrough[]>,
      misPlaythroughsByStateName: Map<string, MisPlaythrough[]>
  ): ExplorationImprovementsTaskRegistry {
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

    const obsoleteTaskFactory = (
      (stateName: string, taskType: ExplorationTaskType) => {
        this.explorationTaskObjectFactory.createNewObsoleteTask(
          expId, expVersion, taskType, stateName);
      });
    const resolvedTaskFactory = (
      (stateName: string, taskType: ExplorationTaskType) => {
      });
    return new ExplorationImprovementsTaskRegistry(
      expId, expVersion, states, expStats, openTasks,
      resolvedTaskTypesByStateName, stateAnswerStats,
      cstPlaythroughsByStateName, eqPlaythroughsByStateName,
      misPlaythroughsByStateName, obsoleteTaskFactory, resolvedTaskFactory);
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistryObjectFactory',
  downgradeInjectable(ExplorationImprovementsTaskRegistryObjectFactory));
