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
 * @fileoverview Service responsible for keeping track of all of the registered
 * improvements tasks for an exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { group } from 'd3-array';

import { AnswerStats } from 'domain/exploration/AnswerStatsObjectFactory';
import { States } from 'domain/exploration/StatesObjectFactory';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
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
import {
  CyclicStateTransitionsPlaythroughIssue,
  EarlyQuitPlaythroughIssue,
  MultipleIncorrectSubmissionsPlaythroughIssue,
  PlaythroughIssue
} from 'domain/statistics/PlaythroughIssueObjectFactory';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';

type HbrTask = HighBounceRateTask;
type IflTask = IneffectiveFeedbackLoopTask;
type NgrTask = NeedsGuidingResponsesTask;
type SiaTask = SuccessiveIncorrectAnswersTask;

type CstPlaythroughIssue = CyclicStateTransitionsPlaythroughIssue;
type EqPlaythroughIssue = EarlyQuitPlaythroughIssue;
type MisPlaythroughIssue = MultipleIncorrectSubmissionsPlaythroughIssue;

/**
 * Holds shallow references to the state-specific statistics used to support the
 * tasks of a state. These statistics help determine whether a task should
 * become open, resolved, or obsolete.
 *
 * We keep shallow references to the statistics because they are shared across
 * services. As a consequence, we can receive updates to the stats with minimal
 * communication between services.
 *
 * Although some tasks do require exploration-level statistics, this class does
 * not hold onto them. Doing so would be extremely wasteful, since every state
 * would be holding a reference to the exact same instance. Instead, we pass
 * them explicitly as needed.
 */
class SupportingStateStats {
  public readonly answerStats: readonly AnswerStats[];
  public readonly cstPlaythroughIssues: readonly CstPlaythroughIssue[];
  public readonly eqPlaythroughIssues: readonly EqPlaythroughIssue[];
  public readonly misPlaythroughIssues: readonly MisPlaythroughIssue[];

  constructor(
      answerStats: readonly AnswerStats[] = [],
      cstPlaythroughIssues: readonly CstPlaythroughIssue[] = [],
      eqPlaythroughIssues: readonly EqPlaythroughIssue[] = [],
      misPlaythroughIssues: readonly MisPlaythroughIssue[] = []) {
    this.answerStats = [...answerStats];
    this.cstPlaythroughIssues = [...cstPlaythroughIssues];
    this.eqPlaythroughIssues = [...eqPlaythroughIssues];
    this.misPlaythroughIssues = [...misPlaythroughIssues];
  }
}

/**
 * Container for the tasks of an exploration's state, coupled with references to
 * their supporting statistics.
 *
 * The class provides a container-like interface for convenience and because it
 * fits with the "container" model the class aims to fulfill.
 */
class StateTasks implements Iterable<ExplorationTask> {
  public readonly hbrTask: HighBounceRateTask;
  public readonly iflTask: IneffectiveFeedbackLoopTask;
  public readonly ngrTask: NeedsGuidingResponsesTask;
  public readonly siaTask: SuccessiveIncorrectAnswersTask;

  public readonly supportingStateStats: SupportingStateStats;

  constructor(
      tasksByType: ReadonlyMap<ExplorationTaskType, ExplorationTask>,
      supportingStateStats: SupportingStateStats = new SupportingStateStats()) {
    this.hbrTask = <HbrTask> tasksByType.get(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE);
    this.iflTask = <IflTask> tasksByType.get(
      ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP);
    this.ngrTask = <NgrTask> tasksByType.get(
      ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES);
    this.siaTask = <SiaTask> tasksByType.get(
      ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS);

    this.supportingStateStats = supportingStateStats;
  }

  public refresh(
      expStats: ExplorationStats, config: ExplorationImprovementsConfig): void {
    this.hbrTask.refreshStatus(
      expStats, this.supportingStateStats.eqPlaythroughIssues.length, config);
    this.iflTask.refreshStatus(
      this.supportingStateStats.cstPlaythroughIssues.length);
    this.ngrTask.refreshStatus(
      this.supportingStateStats.answerStats);
    this.siaTask.refreshStatus(
      this.supportingStateStats.misPlaythroughIssues.length);
  }

  *[Symbol.iterator](): Iterator<ExplorationTask> {
    yield this.hbrTask;
    yield this.iflTask;
    yield this.ngrTask;
    yield this.siaTask;
  }

  map<U>(fn: <T extends ExplorationTask>(_: T) => U): U[] {
    return [
      fn(this.hbrTask),
      fn(this.iflTask),
      fn(this.ngrTask),
      fn(this.siaTask),
    ];
  }
}

/**
 * Manages all of the improvement tasks for an exploration.
 *
 * Provides hooks for keeping the tasks fresh after events which could otherwise
 * invalidate them.
 */
@Injectable({providedIn: 'root'})
export class ExplorationImprovementsTaskRegistryService {
  private config: ExplorationImprovementsConfig;
  private expStats: ExplorationStats;
  private tasksByState: Map<string, StateTasks>;
  private tasksByType: Map<ExplorationTaskType, ExplorationTask[]>;

  constructor(
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory) {}

  initialize(
      config: ExplorationImprovementsConfig,
      states: States,
      expStats: ExplorationStats,
      openTasks: readonly ExplorationTask[],
      resolvedTaskTypesByStateName: ReadonlyMap<string, ExplorationTaskType[]>,
      topAnswersByStateName: ReadonlyMap<string, AnswerStats[]>,
      playthroughIssues: readonly PlaythroughIssue[]): void {
    this.config = config;
    this.validateInitializationArgs(
      config, states, expStats, openTasks,
      resolvedTaskTypesByStateName, topAnswersByStateName,
      playthroughIssues);

    this.expStats = expStats;
    this.tasksByState = new Map();
    this.tasksByType = new Map(
      ImprovementsConstants.TASK_TYPES.map(taskType => [taskType, []]));

    const openTasksByStateName = group(openTasks, t => t.targetId);
    const playthroughIssuesByStateName = (
      group(playthroughIssues, p => p.getStateNameWithIssue()));

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
      newStateTasks.refresh(this.expStats, this.config);
    }
  }

  onStateAdd(newStateName: string): void {
    const newStateTasks = new StateTasks(
      new Map(ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          newStateName),
      ])));

    for (const newTask of newStateTasks) {
      this.tasksByType.get(newTask.taskType).push(newTask);
    }

    this.tasksByState.set(newStateName, newStateTasks);
    this.expStats = this.expStats.createNewWithStateAdded(newStateName);
  }

  onStateDelete(oldStateName: string): void {
    const oldStateTasks = this.tasksByState.get(oldStateName);

    for (const oldTask of oldStateTasks) {
      oldTask.markAsObsolete();
    }

    // Map uses the reserved keyword delete as a method name.
    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(oldStateName);
    this.expStats = this.expStats.createNewWithStateDeleted(oldStateName);
  }

  onStateRename(oldStateName: string, newStateName: string): void {
    const oldStateTasks = this.tasksByState.get(oldStateName);
    const newStateTasks = new StateTasks(
      new Map(oldStateTasks.map(oldTask => [
        oldTask.taskType,
        this.explorationTaskObjectFactory.createFromBackendDict({
          ...oldTask.toBackendDict(),
          ...{target_id: newStateName},
        })
      ])),
      oldStateTasks.supportingStateStats);

    for (const newTask of newStateTasks) {
      this.tasksByType.get(newTask.taskType).push(newTask);
    }
    for (const oldTask of oldStateTasks) {
      oldTask.markAsObsolete();
    }

    this.tasksByState.set(newStateName, newStateTasks);
    // Map uses the reserved keyword delete as a method name.
    // eslint-disable-next-line dot-notation
    this.tasksByState.delete(oldStateName);
    this.expStats = this.expStats.createNewWithStateRenamed(
      oldStateName, newStateName);
  }

  onChangeInteraction(stateName: string): void {
    this.tasksByState.get(stateName).refresh(this.expStats, this.config);
  }

  getHighBounceRateTasks(): HbrTask[] {
    return <HbrTask[]> this.tasksByType.get(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE);
  }

  getIneffectiveFeedbackLoopTasks(): IflTask[] {
    return <IflTask[]> this.tasksByType.get(
      ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP);
  }

  getNeedsGuidingResponsesTasks(): NgrTask[] {
    return <NgrTask[]> this.tasksByType.get(
      ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES);
  }

  getSuccessiveIncorrectAnswersTasks(): SiaTask[] {
    return <SiaTask[]> this.tasksByType.get(
      ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS);
  }

  getSupportingStateStats(task: ExplorationTask): SupportingStateStats {
    if (!this.tasksByState.has(task.targetId)) {
      throw new Error('Unregistered task has no supporting stats');
    }
    return this.tasksByState.get(task.targetId).supportingStateStats;
  }

  private validateInitializationArgs(
      config: ExplorationImprovementsConfig,
      states: States,
      expStats: ExplorationStats,
      openTasks: readonly ExplorationTask[],
      resolvedTaskTypesByStateName: ReadonlyMap<string, ExplorationTaskType[]>,
      topAnswersByStateName: ReadonlyMap<string, AnswerStats[]>,
      playthroughIssues: readonly PlaythroughIssue[]): void {
    // Validate that the exploration stats correspond with provided exploration.
    if (expStats.expId !== config.explorationId) {
      throw new Error(
        'Expected stats for exploration "' + config.explorationId + '", but ' +
        'got stats for exploration "' + expStats.expId + '"');
    }
    if (expStats.expVersion !== config.explorationVersion) {
      throw new Error(
        'Expected stats for exploration version ' + config.explorationVersion +
        ', but got stats for exploration version ' + expStats.expVersion);
    }

    // Validate that all state names referenced by the provided arguments exist
    // according to the source-of-truth: the `states` argument.
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

    // Validate that each open task is targeting the provided exploration.
    for (const task of openTasks) {
      if (task.entityId !== config.explorationId) {
        throw new Error(
          'Expected task for exploration "' + config.explorationId + '", but ' +
          'got task for exploration "' + task.entityId + '"');
      }
      if (task.entityVersion !== config.explorationVersion) {
        throw new Error(
          'Expected task for exploration version ' +
          config.explorationVersion + ', but got task for exploration ' +
          'version ' + task.entityVersion);
      }
    }

    // Validate that there are no tasks with the same type targeting the same
    // state.
    const stateNameReferencesByTaskType = new Map(
      ImprovementsConstants.TASK_TYPES.map(taskType => [taskType, new Set()]));
    for (const task of openTasks) {
      const stateNameReferences = (
        stateNameReferencesByTaskType.get(task.taskType));
      if (stateNameReferences.has(task.targetId)) {
        throw new Error(
          'Found duplicate task of type "' + task.taskType + '" targeting ' +
          'state "' + task.targetId + '"');
      } else {
        stateNameReferences.add(task.targetId);
      }
    }
    for (const [stateName, taskTypes] of resolvedTaskTypesByStateName) {
      for (const taskType of taskTypes) {
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

  private registerNewStateTasks(
      stateName: string,
      openTasks: readonly ExplorationTask[],
      resolvedTaskTypes: readonly ExplorationTaskType[],
      answerStats: readonly AnswerStats[],
      cstPlaythroughIssues: readonly CstPlaythroughIssue[],
      eqPlaythroughIssues: readonly EqPlaythroughIssue[],
      misPlaythroughIssues: readonly MisPlaythroughIssue[]): StateTasks {
    const tasksByType = new Map(<[ExplorationTaskType, ExplorationTask][]> [
      // NOTE TO DEVELOPERS: The last repeated key wins. For example:
      //    let map = new Map([['a', 1], ['b', 3], ['a', 9]]);
      //    map.get('a'); // Returns 9.
      ...ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          stateName)
      ]),
      ...openTasks.map(task => [
        task.taskType, task
      ]),
      ...resolvedTaskTypes.map(taskType => [
        taskType, this.explorationTaskObjectFactory.createNewResolvedTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          stateName)
      ]),
    ]);
    const supportingStateStats = new SupportingStateStats(
      answerStats, cstPlaythroughIssues, eqPlaythroughIssues,
      misPlaythroughIssues);
    const newStateTasks = new StateTasks(tasksByType, supportingStateStats);

    for (const task of newStateTasks) {
      this.tasksByType.get(task.taskType).push(task);
    }

    this.tasksByState.set(stateName, newStateTasks);
    return newStateTasks;
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistryService',
  downgradeInjectable(ExplorationImprovementsTaskRegistryService));
