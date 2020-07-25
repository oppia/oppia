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
 * @fileoverview Unit tests for the HighBounceRateTask domain object.
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';
import { HighBounceRateTaskObjectFactory } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { ExplorationStatsObjectFactory, ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';

describe('High bounce rate task', function() {
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory;
  let highBounceRateTaskObjectFactory: HighBounceRateTaskObjectFactory;

  beforeEach(() => {
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
    highBounceRateTaskObjectFactory = (
      TestBed.get(HighBounceRateTaskObjectFactory));
  });

  beforeEach(() => {
    this.config = (
      new ExplorationImprovementsConfig('eid', 1, true, 0.25, 0.20, 100));
    this.createFromExplorationStats = (
        expStats: ExplorationStats, stateName: string,
        numEqPlaythroughs: number) => {
      const task = highBounceRateTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: stateName,
        issue_description: null,
        status: 'obsolete',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      });
      task.refreshStatus(expStats, numEqPlaythroughs, this.config);
      return task;
    };
    this.newExplorationStatsWithBounceRate = (
      (numExpStarts: number, bounceRate: number) => {
        return explorationStatsObjectFactory.createFromBackendDict({
          exp_id: 'eid',
          exp_version: 1,
          num_starts: numExpStarts,
          num_actual_starts: 0,
          num_completions: 0,
          state_stats_mapping: {
            Introduction: {
              total_answers_count: 0,
              useful_feedback_count: 0,
              total_hit_count: numExpStarts,
              first_hit_count: 0,
              num_times_solution_viewed: 0,
              num_completions: Math.round(numExpStarts * (1 - bounceRate)),
            },
          },
        });
      });
  });

  it('should return new task if any state has a high bounce rate', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.50), 'Introduction', 1);

    expect(task).not.toBeNull();
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription())
      .toEqual('50% of learners had dropped off at this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should return obsolete if state has a low bounce rate', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.15), 'Introduction', 1);
    expect(task.isObsolete()).toBeTrue();
  });

  it('should return obsolete if state has no early quit playthroughs', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.15), 'Introduction', 0);
    expect(task.isObsolete()).toBeTrue();
  });

  it('should return obsolete if exploration starts are too low', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(80, 0.50), 'Introduction', 1);
    expect(task.isObsolete()).toBeTrue();
  });

  it('should create from a high bounce rate backend dict', () => {
    const task = highBounceRateTaskObjectFactory.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '28% of learners had dropped off at this card.',
      status: 'open',
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription())
      .toEqual('28% of learners had dropped off at this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should throw when backend dict entity type is not exploration', () => {
    expect(
      () => highBounceRateTaskObjectFactory.createFromBackendDict({
        entity_type: '???',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '28% of learners had dropped off at this card.',
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has entity_type "???" but expected "exploration"');
  });

  it('should throw when backend dict task type is not high bounce rate', () => {
    expect(
      () => highBounceRateTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        // @ts-ignore Suppress compile-time error for testing.
        task_type: '???',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '28% of learners had dropped off at this card.',
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has task_type "???" but expected "high_bounce_rate"');
  });

  it('should throw when backend dict target type is not state', () => {
    expect(
      () => highBounceRateTaskObjectFactory.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'high_bounce_rate',
        target_type: '???',
        target_id: 'Introduction',
        issue_description: '28% of learners had dropped off at this card.',
        status: 'open',
        resolver_username: null,
        resolver_profile_picture_data_url: null,
        resolved_on_msecs: null,
      })
    ).toThrowError('backend dict has target_type "???" but expected "state"');
  });

  it('should update status based on changes to exploration stats', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.50), 'Introduction', 1);
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
    expect(task.isResolved()).toBeFalse();

    task.refreshStatus(
      this.newExplorationStatsWithBounceRate(200, 0.10), 1, this.config);
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeTrue();
    expect(task.isResolved()).toBeFalse();

    task.refreshStatus(
      this.newExplorationStatsWithBounceRate(200, 0.80), 1, this.config);
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
    expect(task.isResolved()).toBeFalse();
  });

  it('should throw when provided stats from a different exploration', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.50), 'Introduction', 1);

    const statsWithWrongId = (
      explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid2',
        exp_version: 1,
        num_starts: 100,
        num_actual_starts: 0,
        num_completions: 0,
        state_stats_mapping: {
          Introduction: {
            total_answers_count: 0,
            useful_feedback_count: 0,
            total_hit_count: 100,
            first_hit_count: 0,
            num_times_solution_viewed: 0,
            num_completions: 50,
          },
        },
      }));
    expect(() => task.refreshStatus(statsWithWrongId, 1, this.config))
      .toThrowError(
        'Expected stats for exploration id="eid" v1 but given stats are for ' +
        'exploration id="eid2" v1');

    const statsWithWrongVersion = (
      explorationStatsObjectFactory.createFromBackendDict({
        exp_id: 'eid',
        exp_version: 2,
        num_starts: 100,
        num_actual_starts: 0,
        num_completions: 0,
        state_stats_mapping: {
          Introduction: {
            total_answers_count: 0,
            useful_feedback_count: 0,
            total_hit_count: 100,
            first_hit_count: 0,
            num_times_solution_viewed: 0,
            num_completions: 50,
          },
        },
      }));
    expect(() => task.refreshStatus(statsWithWrongVersion, 1, this.config))
      .toThrowError(
        'Expected stats for exploration id="eid" v1 but given stats are for ' +
        'exploration id="eid" v2');
  });

  it('should not update status when number of starts is too low', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.50), 'Introduction', 1);
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();

    task.refreshStatus(
      this.newExplorationStatsWithBounceRate(25, 0.05), 1, this.config);
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
  });

  it('should stay resolved regardless of changes in exploration stats', () => {
    const task = this.createFromExplorationStats(
      this.newExplorationStatsWithBounceRate(200, 0.50), 'Introduction', 1);
    expect(task.isResolved()).toBeFalse();
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();

    task.resolve();
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();

    task.refreshStatus(
      this.newExplorationStatsWithBounceRate(200, 0.05), 1, this.config);
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();

    task.refreshStatus(
      this.newExplorationStatsWithBounceRate(200, 0.95), 1, this.config);
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();
  });
});
