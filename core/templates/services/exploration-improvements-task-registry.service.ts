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

import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { States } from 'domain/exploration/StatesObjectFactory';
import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config.model';
import {
  ExplorationTask,
  ExplorationTaskModel,
  ExplorationTaskType,
} from 'domain/improvements/exploration-task.model';
import { HighBounceRateTask } from
  'domain/improvements/high-bounce-rate-task.model';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/ineffective-feedback-loop-task.model';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/needs-guiding-response-task.model';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/successive-incorrect-answers-task.model';
import { State } from 'domain/state/StateObjectFactory';
import {
  PlaythroughIssue,
  PlaythroughIssueType,
} from 'domain/statistics/playthrough-issue.model';
import { ExplorationStats } from
  'domain/statistics/exploration-stats.model';
import { StateStats } from 'domain/statistics/state-stats-model';

type HbrTask = HighBounceRateTask;
type IflTask = IneffectiveFeedbackLoopTask;
type NgrTask = NeedsGuidingResponsesTask;
type SiaTask = SuccessiveIncorrectAnswersTask;

type CstPlaythroughIssue = PlaythroughIssue;
type EqPlaythroughIssue = PlaythroughIssue;
type MisPlaythroughIssue = PlaythroughIssue;

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
export class SupportingStateStats {
  public readonly stateStats: StateStats;
  public readonly answerStats: readonly AnswerStats[];
  public readonly cstPlaythroughIssues: readonly CstPlaythroughIssue[];
  public readonly eqPlaythroughIssues: readonly EqPlaythroughIssue[];
  public readonly misPlaythroughIssues: readonly MisPlaythroughIssue[];

  constructor(
      stateStats: StateStats,
      answerStats: readonly AnswerStats[] = [],
      cstPlaythroughIssues: readonly CstPlaythroughIssue[] = [],
      eqPlaythroughIssues: readonly EqPlaythroughIssue[] = [],
      misPlaythroughIssues: readonly MisPlaythroughIssue[] = []) {
    this.stateStats = stateStats;
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
export class StateTasks implements Iterable<ExplorationTask> {
  public readonly stateName: string;
  public readonly hbrTask: HighBounceRateTask;
  public readonly iflTask: IneffectiveFeedbackLoopTask;
  public readonly ngrTask: NeedsGuidingResponsesTask;
  public readonly siaTask: SuccessiveIncorrectAnswersTask;
  public readonly length: number = 4;

  public readonly supportingStats: SupportingStateStats;

  constructor(
      stateName: string,
      tasksByType: ReadonlyMap<ExplorationTaskType, ExplorationTask>,
      supportingStats: SupportingStateStats) {
    this.stateName = stateName;
    this.hbrTask = tasksByType.get(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE) as HbrTask;
    this.iflTask = tasksByType.get(
      ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP) as IflTask;
    this.ngrTask = tasksByType.get(
      ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES) as NgrTask;
    this.siaTask = tasksByType.get(
      ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS) as SiaTask;
    this.supportingStats = supportingStats;
  }

  public refresh(
      expStats: ExplorationStats, config: ExplorationImprovementsConfig): void {
    this.hbrTask.refreshStatus(
      expStats, this.supportingStats.eqPlaythroughIssues.length, config);
    this.iflTask.refreshStatus(
      this.supportingStats.cstPlaythroughIssues.length);
    this.ngrTask.refreshStatus(
      this.supportingStats.answerStats);
    this.siaTask.refreshStatus(
      this.supportingStats.misPlaythroughIssues.length);
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
  private config!: ExplorationImprovementsConfig;
  private expStats!: ExplorationStats;
  private tasksByState!: Map<string, StateTasks>;
  private openTasksByType!: ReadonlyMap<ExplorationTaskType, ExplorationTask[]>;

  initialize(
      config: ExplorationImprovementsConfig,
      states: States,
      expStats: ExplorationStats,
      openTasks: readonly ExplorationTask[],
      resolvedTaskTypesByStateName:
        ReadonlyMap<string, readonly ExplorationTaskType[]>,
      topAnswersByStateName: ReadonlyMap<string, readonly AnswerStats[]>,
      playthroughIssues: readonly PlaythroughIssue[]): void {
    this.validateInitializationArgs(
      config, states, expStats, openTasks,
      resolvedTaskTypesByStateName, topAnswersByStateName,
      playthroughIssues);

    this.config = config;
    this.expStats = expStats;
    this.tasksByState = new Map();
    this.openTasksByType = new Map(
      ImprovementsConstants.TASK_TYPES.map(taskType => [taskType, []]));

    const openTasksByStateName = group(openTasks, t => t.targetId);
    const playthroughIssuesByStateName = (
      group(playthroughIssues, p => p.getStateNameWithIssue()));

    for (const stateName of states.getStateNames()) {
      const playthroughIssuesByType = group(
        playthroughIssuesByStateName.get(stateName) || [], p => p.issueType);
      const cstPlaythroughIssues = (
        playthroughIssuesByType.get(PlaythroughIssueType.CyclicStateTransitions)
      ) as CstPlaythroughIssue[];
      const eqPlaythroughIssues = playthroughIssuesByType.get(
        PlaythroughIssueType.EarlyQuit
      ) as EqPlaythroughIssue[];
      const misPlaythroughIssues = playthroughIssuesByType.get(
        PlaythroughIssueType.MultipleIncorrectSubmissions
      ) as MisPlaythroughIssue[];

      this.registerNewStateTasks(
        stateName,
        openTasksByStateName.get(stateName) || [],
        resolvedTaskTypesByStateName.get(stateName) || [],
        topAnswersByStateName.get(stateName) || [],
        cstPlaythroughIssues || [],
        eqPlaythroughIssues || [],
        misPlaythroughIssues || []);
      this.refreshStateTasks(stateName);
    }
  }

  getExplorationStats(): ExplorationStats {
    return this.expStats;
  }

  onStateAdded(newStateName: string): void {
    this.expStats = this.expStats.createNewWithStateAdded(newStateName);
    const newStateTasks = new StateTasks(
      newStateName,
      new Map(ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, ExplorationTaskModel.createNewObsoleteTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          newStateName),
      ])),
      new SupportingStateStats(this.expStats.getStateStats(newStateName)));

    this.tasksByState.set(newStateName, newStateTasks);
  }

  onStateDeleted(oldStateName: string): void {
    this.expStats = this.expStats.createNewWithStateDeleted(oldStateName);
    const oldStateTasks = this.tasksByState.get(oldStateName);

    for (const oldTask of (oldStateTasks as StateTasks)) {
      if (oldTask.isOpen()) {
        this.popOpenTask(oldTask);
      }
      oldTask.markAsObsolete();
    }

    this.tasksByState.delete(oldStateName);
  }

  onStateRenamed(oldStateName: string, newStateName: string): void {
    this.expStats = this.expStats.createNewWithStateRenamed(
      oldStateName, newStateName);
    const oldStateTasks = this.tasksByState.get(oldStateName);
    const newStateTasks = new StateTasks(
      newStateName,
      new Map((oldStateTasks as StateTasks).map(oldTask => [
        oldTask.taskType,
        ExplorationTaskModel.createFromBackendDict({
          ...oldTask.toBackendDict(),
          ...{target_id: newStateName},
        })
      ])),
      new SupportingStateStats(
        this.expStats.getStateStats(newStateName),
        (oldStateTasks as StateTasks).supportingStats.answerStats,
        (oldStateTasks as StateTasks).supportingStats.cstPlaythroughIssues,
        (oldStateTasks as StateTasks).supportingStats.eqPlaythroughIssues,
        (oldStateTasks as StateTasks).supportingStats.misPlaythroughIssues));

    for (const newTask of newStateTasks) {
      if (newTask.isOpen()) {
        this.pushOpenTask(newTask);
      }
    }
    for (const oldTask of (oldStateTasks as StateTasks)) {
      if (oldTask.isOpen()) {
        this.popOpenTask(oldTask);
      }
      oldTask.markAsObsolete();
    }

    this.tasksByState.set(newStateName, newStateTasks);
    this.tasksByState.delete(oldStateName);
  }

  onStateInteractionSaved(state: State): void {
    this.refreshStateTasks(state.name as string);
  }

  getOpenHighBounceRateTasks(): HbrTask[] {
    return this.openTasksByType.get(
      ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE) as HbrTask[];
  }

  getOpenIneffectiveFeedbackLoopTasks(): IflTask[] {
    return this.openTasksByType.get(
      ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP) as IflTask[];
  }

  getOpenNeedsGuidingResponsesTasks(): NgrTask[] {
    return this.openTasksByType.get(
      ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES) as NgrTask[];
  }

  getOpenSuccessiveIncorrectAnswersTasks(): SiaTask[] {
    return this.openTasksByType.get(
      ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS
    ) as SiaTask[];
  }

  getStateTasks(stateName: string): StateTasks {
    if (!this.tasksByState.has(stateName)) {
      throw new Error('Unknown state with name: ' + stateName);
    }
    return this.tasksByState.get(stateName) as StateTasks;
  }

  getAllStateTasks(): StateTasks[] {
    return Array.from(this.tasksByState.values());
  }

  private validateInitializationArgs(
      config: ExplorationImprovementsConfig,
      states: States,
      expStats: ExplorationStats,
      openTasks: readonly ExplorationTask[],
      resolvedTaskTypesByStateName: ReadonlyMap<
          string, readonly ExplorationTaskType[]>,
      topAnswersByStateName: ReadonlyMap<string, readonly AnswerStats[]>,
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
      if ((stateNameReferences as Set<string>).has(task.targetId)) {
        throw new Error(
          'Found duplicate task of type "' + task.taskType + '" targeting ' +
          'state "' + task.targetId + '"');
      } else {
        (stateNameReferences as Set<string>).add(task.targetId);
      }
    }
    for (const [stateName, taskTypes] of resolvedTaskTypesByStateName) {
      for (const taskType of taskTypes) {
        const stateNameReferences = stateNameReferencesByTaskType.get(taskType);
        if ((stateNameReferences as Set<string>).has(stateName)) {
          throw new Error(
            'Found duplicate task of type "' + taskType + '" targeting state ' +
            '"' + stateName + '"');
        } else {
          (stateNameReferences as Set<string>).add(stateName);
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
    if (!this.expStats.hasStateStates(stateName)) {
      // Not an error to be missing stats.
      this.expStats = this.expStats.createNewWithStateAdded(stateName);
    }
    const tasksByType = new Map([
      // NOTE TO DEVELOPERS: The last repeated key wins. For example:
      //    let map = new Map([['a', 1], ['b', 3], ['a', 9]]);
      //    map.get('a'); // Returns 9.
      ...ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, ExplorationTaskModel.createNewObsoleteTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          stateName)
      ]),
      ...openTasks.map(task => [
        task.taskType, task
      ]),
      ...resolvedTaskTypes.map(taskType => [
        taskType, ExplorationTaskModel.createNewResolvedTask(
          this.config.explorationId, this.config.explorationVersion, taskType,
          stateName)
      ]),
    ] as [ExplorationTaskType, ExplorationTask][]);
    const supportingStats = new SupportingStateStats(
      this.expStats.getStateStats(stateName), answerStats, cstPlaythroughIssues,
      eqPlaythroughIssues, misPlaythroughIssues);
    const newStateTasks = (
      new StateTasks(stateName, tasksByType, supportingStats));

    for (const task of newStateTasks) {
      if (task.isOpen()) {
        this.pushOpenTask(task);
      }
    }

    this.tasksByState.set(stateName, newStateTasks);
    return newStateTasks;
  }

  private refreshStateTasks(stateName: string): void {
    const stateTasks = this.tasksByState.get(stateName);
    const tasksWithOldStatus: [ExplorationTask, string][] = (
      (stateTasks as StateTasks).map(task => [task, task.getStatus()]));

    (stateTasks as StateTasks).refresh(this.expStats, this.config);

    for (const [task, oldStatus] of tasksWithOldStatus) {
      if (task.getStatus() === oldStatus) {
        continue;
      } else if (task.getStatus() === ImprovementsConstants.TASK_STATUS_OPEN) {
        this.pushOpenTask(task);
      } else if (oldStatus === ImprovementsConstants.TASK_STATUS_OPEN) {
        this.popOpenTask(task);
      }
    }
  }

  /** Pre-condition: task is missing from the openTasksByType data structure. */
  private pushOpenTask(task: ExplorationTask): void {
    (this.openTasksByType.get(task.taskType) as ExplorationTask[]).push(task);
  }

  /** Pre-condition: task is present in the openTasksByType data structure. */
  private popOpenTask(task: ExplorationTask): void {
    const arrayWithTask = this.openTasksByType.get(task.taskType);
    (arrayWithTask as ExplorationTask[]).splice(
      (arrayWithTask as ExplorationTask[]).indexOf(task), 1);
  }
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistryService',
  downgradeInjectable(ExplorationImprovementsTaskRegistryService));
