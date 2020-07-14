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

/**
 * Holds shallow references to the state-specific statistics used to support the
 * tasks of a state. These statistics determine whether a task should become
 * open, resolved, or obsolete.
 *
 * We keep shallow references to the statistics because they are shared across
 * services. Thus, the referenced instances can be expected to silently change.
 *
 * NOTE: Although some tasks do require exploration-level statistics, this class
 * does not hold onto them because it would be extremely wasteful (since such
 * stats would be equivalent across every state).
 */
class SupportingStateStats {
  public readonly answerStats: readonly AnswerStats[];
  public readonly cstPlaythroughIssues: readonly CstPlaythroughIssue[];
  public readonly eqPlaythroughIssues: readonly EqPlaythroughIssue[];
  public readonly misPlaythroughIssues: readonly MisPlaythroughIssue[];

  constructor(
      answerStats: AnswerStats[] = [],
      cstPlaythroughIssues: CstPlaythroughIssue[] = [],
      eqPlaythroughIssues: EqPlaythroughIssue[] = [],
      misPlaythroughIssues: MisPlaythroughIssue[] = []) {
    this.answerStats = [...answerStats];
    this.cstPlaythroughIssues = [...cstPlaythroughIssues];
    this.eqPlaythroughIssues = [...eqPlaythroughIssues];
    this.misPlaythroughIssues = [...misPlaythroughIssues];
  }
}

/**
 * Manages the tasks of a particular state using references to the statistics
 * which supports them.
 *
 * The class behaves like a ReadonlyMap<ExplorationTaskType, ExplorationTask>,
 * while also ensuring that the full set of tasks always exist. As such, it
 * provides a map-like interface to help communicate this intent.
 */
class StateTasks implements Iterable<ExplorationTask> {
  public readonly supportingStateStats: SupportingStateStats;

  public readonly hbrTask: HighBounceRateTask;
  public readonly iflTask: IneffectiveFeedbackLoopTask;
  public readonly ngrTask: NeedsGuidingResponsesTask;
  public readonly siaTask: SuccessiveIncorrectAnswersTask;

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

  public refresh(expStats: ExplorationStats): void {
    this.hbrTask.refreshStatus(
      expStats, this.supportingStateStats.eqPlaythroughIssues.length);
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

  map<U>(fn: <T extends ExplorationTask>(t: T) => U): U[] {
    return [
      fn(this.hbrTask),
      fn(this.iflTask),
      fn(this.ngrTask),
      fn(this.siaTask),
    ];
  }
}

/**
 * Keeps track of all improvement tasks for an exploration.
 *
 * To access the tasks, use the get*Tasks() family of methods.
 *
 * Provides hooks for keeping the tasks fresh in the event of an exploration
 * change, giving the task an opportunity to refresh itself.
 */
@Injectable({providedIn: 'root'})
export class ExplorationImprovementsTaskRegistryService {
  private expId: string;
  private expVersion: number;
  private expStats: ExplorationStats;
  private tasksByState: Map<string, StateTasks>;
  private tasksByType: Map<ExplorationTaskType, ExplorationTask[]>;

  constructor(
      private explorationTaskObjectFactory: ExplorationTaskObjectFactory) {}

  initialize(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      topAnswersByStateName: Map<string, AnswerStats[]>,
      playthroughIssues: PlaythroughIssue[]): void {
    this.validateInitializationArgs(
      expId, expVersion, states, expStats, openTasks,
      resolvedTaskTypesByStateName, topAnswersByStateName,
      playthroughIssues);

    this.expId = expId;
    this.expVersion = expVersion;
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
    // NOTE TO DEVELOPERS: This type is required to help the compiler realize
    // that the arguments to the new Map are all of the same type.
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

  onStateAdd(newStateName: string): void {
    const newStateTasks = new StateTasks(
      new Map(ImprovementsConstants.TASK_TYPES.map(taskType => [
        taskType, this.explorationTaskObjectFactory.createNewObsoleteTask(
          this.expId, this.expVersion, taskType, newStateName),
      ])));

    for (const newTask of newStateTasks) {
      this.tasksByType.get(newTask.taskType).push(newTask);
    }

    this.tasksByState.set(newStateName, newStateTasks);
    this.expStats = this.expStats.withStateAdded(newStateName);
  }

  onStateDelete(oldStateName: string): void {
    const oldStateTasks = this.tasksByState.get(oldStateName);

    for (const oldTask of oldStateTasks) {
      oldTask.markAsObsolete();
    }

    this.tasksByState.delete(oldStateName);
    this.expStats = this.expStats.withStateDeleted(oldStateName);
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
    this.tasksByState.delete(oldStateName);
    this.expStats = this.expStats.withStateRenamed(oldStateName, newStateName);
  }

  onChangeInteraction(stateName: string): void {
    this.tasksByState.get(stateName).refresh(this.expStats);
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

  private validateInitializationArgs(
      expId: string,
      expVersion: number,
      states: States,
      expStats: ExplorationStats,
      openTasks: ExplorationTask[],
      resolvedTaskTypesByStateName: Map<string, ExplorationTaskType[]>,
      topAnswersByStateName: Map<string, AnswerStats[]>,
      playthroughIssues: PlaythroughIssue[]): void {
    // Validate that the exploration stats correspond to the provided
    // exploration.
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

    // Validate that all state names referenced by the provided statistics refer
    // to one of the states in the given states, which acts as the
    // "source-of-truth".
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

    // Validate that at most one task type is targeting a state.
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
}

angular.module('oppia').factory(
  'ExplorationImprovementsTaskRegistryService',
  downgradeInjectable(ExplorationImprovementsTaskRegistryService));
