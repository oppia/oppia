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

import { ExplorationStats, ExplorationStatsObjectFactory } from
  'domain/statistics/ExplorationStatsObjectFactory';
import { HighBounceRateTaskObjectFactory } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { IStateStatsBackendDict } from
  'domain/statistics/StateStatsObjectFactory';

describe('High bounce rate task', function() {
  let explorationStatsObjectFactory: ExplorationStatsObjectFactory = null;
  let highBounceRateTaskObjectFactory: HighBounceRateTaskObjectFactory = null;

  beforeEach(() => {
    explorationStatsObjectFactory = TestBed.get(ExplorationStatsObjectFactory);
    highBounceRateTaskObjectFactory = (
      TestBed.get(HighBounceRateTaskObjectFactory));
  });

  beforeEach(() => {
    this.makeExplorationStatsWithBounceRate = (
      (numExpStarts: number, bounceRate: number): ExplorationStats => {
        return explorationStatsObjectFactory.createFromBackendDict({
          exp_id: 'eid',
          exp_version: 1,
          num_starts: numExpStarts,
          num_actual_starts: 20,
          num_completions: 200,
          state_stats_mapping: {
            Introduction: (
              <IStateStatsBackendDict>{
                total_answers_count: 0,
                useful_feedback_count: 0,
                total_hit_count: numExpStarts,
                first_hit_count: 0,
                num_times_solution_viewed: 0,
                num_completions: numExpStarts * (1 - bounceRate),
              }),
          },
        });
      });
  });

  it('should create new task when a state has a high bounce rate', () => {
    const task = highBounceRateTaskObjectFactory.createFromExplorationStats(
      this.makeExplorationStatsWithBounceRate(200, 0.50), 'Introduction');

    expect(task).not.toBeNull();
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription())
      .toEqual('50% of learners had dropped off at this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should not be created when state has a low bounce rate', () => {
    expect(
      highBounceRateTaskObjectFactory.createFromExplorationStats(
        this.makeExplorationStatsWithBounceRate(200, 0.15), 'Introduction'))
      .toBeNull();
  });

  it('should not be created when state has too few exploration starts', () => {
    expect(
      highBounceRateTaskObjectFactory.createFromExplorationStats(
        this.makeExplorationStatsWithBounceRate(80, 0.50), 'Introduction'))
      .toBeNull();
  });

  it('should create from a high bounce rate backend dict', () => {
    const task = highBounceRateTaskObjectFactory.createFromBackendDict({
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '28% of learners had dropped off at this card.',
      status: 'open',
      closed_by: null,
      closed_on_msecs: null
    });

    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription())
      .toEqual('28% of learners had dropped off at this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should return null if backend dict is not a high bounce rate', () => {
    expect(
      highBounceRateTaskObjectFactory.createFromBackendDict({
        task_type: '???',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '28% of learners had dropped off at this card.',
        status: 'open',
        closed_by: null,
        closed_on_msecs: null
      })).toBeNull();
  });

  it('should return null if backend dict does not target states', () => {
    expect(
      highBounceRateTaskObjectFactory.createFromBackendDict({
        task_type: 'high_bounce_rate',
        target_type: '???',
        target_id: 'Introduction',
        issue_description: '28% of learners had dropped off at this card.',
        status: 'open',
        closed_by: null,
        closed_on_msecs: null
      })).toBeNull();
  });

  it('should capture current date when resolved', () => {
    const task = highBounceRateTaskObjectFactory.createFromExplorationStats(
      this.makeExplorationStatsWithBounceRate(200, 0.50), 'Introduction');
    expect(task.isOpen()).toBeTrue();
    expect(task.isResolved()).toBeFalse();
    expect(task.getClosedBy()).toBeNull();
    expect(task.getClosedOnMsecs()).toBeNull();

    const mockDate = new Date(2020, 6, 12);
    jasmine.clock().mockDate(mockDate);
    task.resolve('uuid');

    expect(task.isOpen()).toBeFalse();
    expect(task.isResolved()).toBeTrue();
    expect(task.getClosedBy()).toEqual('uuid');
    expect(task.getClosedOnMsecs()).toEqual(mockDate.getUTCMilliseconds());
  });

  it('should refresh status from changes in exploration stats', () => {
    const task = highBounceRateTaskObjectFactory.createFromExplorationStats(
      this.makeExplorationStatsWithBounceRate(200, 0.50), 'Introduction');
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
    expect(task.isResolved()).toBeFalse();

    task.refreshStatus(this.makeExplorationStatsWithBounceRate(200, 0.10));
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeTrue();
    expect(task.isResolved()).toBeFalse();

    task.refreshStatus(this.makeExplorationStatsWithBounceRate(200, 0.80));
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
    expect(task.isResolved()).toBeFalse();
  });

  it('should stay resolved regardless of changes in exploration stats', () => {
    const task = highBounceRateTaskObjectFactory.createFromExplorationStats(
      this.makeExplorationStatsWithBounceRate(200, 0.50), 'Introduction');
    expect(task.isResolved()).toBeFalse();
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();

    task.resolve('uuid');
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();

    task.refreshStatus(this.makeExplorationStatsWithBounceRate(200, 0.10));
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();

    task.refreshStatus(this.makeExplorationStatsWithBounceRate(200, 0.80));
    expect(task.isResolved()).toBeTrue();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeFalse();
  });
});
