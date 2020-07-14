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

import { group } from 'd3-array';

import { AnswerStats } from 'domain/exploration/AnswerStatsObjectFactory';
import {
  CyclicStateTransitionsPlaythroughIssue,
  EarlyQuitPlaythroughIssue,
  MultipleIncorrectSubmissionsPlaythroughIssue,
  PlaythroughIssue
} from 'domain/statistics/PlaythroughIssueObjectFactory';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';
import {
  ExplorationTask,
  ExplorationTaskObjectFactory,
  ExplorationTaskType,
} from 'domain/improvements/ExplorationTaskObjectFactory';
import { HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
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

type CstPlaythroughIssue = CyclicStateTransitionsPlaythroughIssue;
type EqPlaythroughIssue = EarlyQuitPlaythroughIssue;
type MisPlaythroughIssue = MultipleIncorrectSubmissionsPlaythroughIssue;

class StateStats {
  constructor(
      public answerStats: AnswerStats[] = [],
      public cstPlaythroughIssues: CstPlaythroughIssue[] = [],
      public eqPlaythroughIssues: EqPlaythroughIssue[] = [],
      public misPlaythroughIssues: MisPlaythroughIssue[] = []) {}
}

class StateTasks {
  public readonly stateName: string;
  public readonly hbrTask: HighBounceRateTask;
  public readonly iflTask: IneffectiveFeedbackLoopTask;
  public readonly ngrTask: NeedsGuidingResponsesTask;
  public readonly siaTask: SuccessiveIncorrectAnswersTask;
  public readonly supportingStats: StateStats;
  public readonly initialHbrTaskStatus: string;
  public readonly ngrTaskWasInitiallyOpen: boolean;

  constructor(
      stateName: string,
      tasksByType: Map<ExplorationTaskType, ExplorationTask>,
      supportingStats: StateStats = new StateStats()) {
    this.stateName = stateName;
    this.hbrTask = <HbrTask> tasksByType.get('high_bounce_rate');
    this.iflTask = <IflTask> tasksByType.get('ineffective_feedback_loop');
    this.ngrTask = <NgrTask> tasksByType.get('needs_guiding_responses');
    this.siaTask = <SiaTask> tasksByType.get('successive_incorrect_answers');
    this.initialHbrTaskStatus = this.hbrTask.getStatus();
    this.ngrTaskWasInitiallyOpen = this.ngrTask.isOpen();
    this.supportingStats = supportingStats;
  }

  public refresh(expStats: ExplorationStats): void {
    this.hbrTask.refreshStatus(
      expStats, this.supportingStats.eqPlaythroughIssues.length);
    this.iflTask.refreshStatus(
      this.supportingStats.cstPlaythroughIssues.length);
    this.ngrTask.refreshStatus(
      this.supportingStats.answerStats);
    this.siaTask.refreshStatus(
      this.supportingStats.misPlaythroughIssues.length);
  }

  public forEach(fn: <T extends ExplorationTask>(t: T) => void): void {
    fn(this.hbrTask);
    fn(this.iflTask);
    fn(this.ngrTask);
    fn(this.siaTask);
  }

  public map<U>(fn: <T extends ExplorationTask>(t: T) => U): U[] {
    return [
      fn(this.hbrTask),
      fn(this.iflTask),
      fn(this.ngrTask),
      fn(this.siaTask),
    ];
  }
}

export class ExplorationImprovementsTaskRegistry {
  public readonly expId: string;
  public readonly expVersion: number;
  private readonly expStats: ExplorationStats;
  private tasksByState: Map<string, StateTasks> = new Map();
  private tasksByType: Map<ExplorationTaskType, ExplorationTask[]> = new Map(
    ImprovementsConstants.TASK_TYPES.map(taskType => [taskType, []]));

  constructor(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      topAnswersByStateName: Map<string, AnswerStats[]>,
      playthroughIssues: PlaythroughIssue[],
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory) {
    this.expId = expId;
    this.expVersion = expVersion;
    this.expStats = expStats;

    // Organize the inputs to make construction simpler.
    const openTasksByStateName = group(openTasks, t => t.targetId);
    const playthroughIssuesByStateName = (
      group(playthroughIssues, p => p.getStateNameWithIssue()));

    // Generate a new set of tasks for each state, based on the input stats.
    for (const stateName of states.getStateNames()) {
      const playthroughIssuesByType = group(
        playthroughIssuesByStateName.get(stateName) || [], p => p.issueType);
      const cstPlaythroughIssues = <CstPlaythroughIssue[]> (
        playthroughIssuesByType.get('CyclicStateTransitions'));
      const eqPlaythroughIssues = <EqPlaythroughIssue[]> (
        playthroughIssuesByType.get('EarlyQuit'));
      const misPlaythroughIssues = <MisPlaythroughIssue[]> (
        playthroughIssuesByType.get('MultipleIncorrectSubmissions'));

      const newStateTasks = this.registerNewStateTasks(
        stateName,
        openTasksByStateName.get(stateName) || [],
        resolvedTaskTypesByStateName.get(stateName) || [],
        topAnswersByStateName.get(stateName) || [],
        cstPlaythroughIssues || [],
        eqPlaythroughIssues || [],
        misPlaythroughIssues || []);
      newStateTasks.refresh(this.expStats);
    }
  }

  private registerNewStateTasks(
      stateName: string,
      openTasks: ExplorationTask[],
      resolvedTaskTypes: ExplorationTaskType[],
      answerStats: AnswerStats[],
      cstPlaythroughIssues: CstPlaythroughIssue[],
      eqPlaythroughIssues: EqPlaythroughIssue[],
      misPlaythroughIssues: MisPlaythroughIssue[]): StateTasks {
    type MapPair = [ExplorationTaskType, ExplorationTask];
    const tasksByType = new Map([
      // NOTE TO DEVELOPERS: The last repeated key wins. For example:
      //    let map = new Map([['a', 1], ['b', 3], ['a', 9]]);
      //    map.get('a'); // Returns 9.
      ...ImprovementsConstants.TASK_TYPES.map(taskType => <MapPair> [
        taskType, this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.expId, this.expVersion, taskType, stateName)
      ]),
      ...openTasks.map(task => <MapPair> [
        task.taskType, task
      ]),
      ...resolvedTaskTypes.map(taskType => <MapPair> [
        taskType, this.explorationTaskObjectFactory.createNewResolvedTask(
          this.expId, this.expVersion, taskType, stateName)
      ]),
    ]);
    const newStateStats = new StateStats(
      answerStats, cstPlaythroughIssues, eqPlaythroughIssues,
      misPlaythroughIssues);
    const newStateTasks = new StateTasks(stateName, tasksByType, newStateStats);
    this.tasksByState.set(stateName, newStateTasks);
    newStateTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
    return newStateTasks;
  }

  onStateAdd(newStateName: string): void {
    const newStateTasks = new StateTasks(
      newStateName, new Map(ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.expId, this.expVersion, taskType, newStateName),
      ])));
    this.tasksByState.set(newStateName, newStateTasks);
    newStateTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
  }

  onStateDelete(oldStateName: string): void {
    const stateTasks = this.tasksByState.get(oldStateName);
    stateTasks.forEach(t => t.markAsObsolete());

    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(oldStateName);
  }

  onStateRename(oldStateName: string, newStateName: string): void {
    const oldStateTasks = this.tasksByState.get(oldStateName);
    const newStateTasks = new StateTasks(
      newStateName, new Map(oldStateTasks.map(task => [
        task.taskType, this.explorationTaskObjectFactory.createFromBackendDict({
          ...task.toBackendDict(),
          ...{target_id: newStateName},
        })
      ])));

    newStateTasks.forEach(t => this.tasksByType.get(t.taskType).push(t));
    oldStateTasks.forEach(t => t.markAsObsolete());

    this.tasksByState.set(newStateName, newStateTasks);
    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(oldStateName);
  }

  onChangeAnswerGroups(stateName: string): void {
    this.tasksByState.get(stateName).refresh(this.expStats);
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
      topAnswersByStateName: Map<string, AnswerStats[]>,
      playthroughIssues: PlaythroughIssue[],
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
    const allStateNameReferences = new Set<string>([
      ...openTasks.map(t => t.targetId),
      ...resolvedTaskTypesByStateName.keys(),
      ...topAnswersByStateName.keys(),
      ...playthroughIssues.map(p => p.getStateNameWithIssue())
    ]);
    for (const stateName of allStateNameReferences) {
      if (!actualStateNames.has(stateName)) {
        throw new Error(
          'Unexpected reference to state "' + stateName + '", which does not ' +
          'exist');
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

    return new ExplorationImprovementsTaskRegistry(
      expId, expVersion, states, expStats, openTasks,
      resolvedTaskTypesByStateName, topAnswersByStateName,
      playthroughIssues, this.explorationTaskObjectFactory);
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistryObjectFactory',
  downgradeInjectable(ExplorationImprovementsTaskRegistryObjectFactory));
