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
 * @fileoverview Unit tests for the ExplorationTaskObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ExplorationTaskObjectFactory } from
  'domain/improvements/ExplorationTaskObjectFactory';
import { HighBounceRateTask } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { ITaskEntryBackendDict } from
  'domain/improvements/TaskEntryObjectFactory';
import { IneffectiveFeedbackLoopTask } from
  'domain/improvements/IneffectiveFeedbackLoopTaskObjectFactory';
import { NeedsGuidingResponsesTask } from
  'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';

describe('Exploration task object factory', () => {
  let expTaskObjectFactory: ExplorationTaskObjectFactory;

  beforeEach(() => {
    expTaskObjectFactory = TestBed.get(ExplorationTaskObjectFactory);
  });

  beforeEach(() => {
    this.newTaskEntryBackendDict = (
      (taskType: string): ITaskEntryBackendDict => ({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: taskType,
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: '20% of learners dropped at this state',
        status: 'resolved',
        resolver_username: 'test_user',
        resolver_profile_picture_data_url: './image.png',
        resolved_on_msecs: 123456789,
      }));
  });

  it('should return a high bounce rate task', () => {
    expect(
      expTaskObjectFactory.createFromBackendDict(
        this.newTaskEntryBackendDict('high_bounce_rate'))
    ).toBeInstanceOf(HighBounceRateTask);
  });

  it('should return a ineffective feedback loop task', () => {
    expect(
      expTaskObjectFactory.createFromBackendDict(
        this.newTaskEntryBackendDict('ineffective_feedback_loop'))
    ).toBeInstanceOf(IneffectiveFeedbackLoopTask);
  });

  it('should return a needs guiding responses task', () => {
    expect(
      expTaskObjectFactory.createFromBackendDict(
        this.newTaskEntryBackendDict('needs_guiding_responses'))
    ).toBeInstanceOf(NeedsGuidingResponsesTask);
  });

  it('should return a successive incorrect answers task', () => {
    expect(
      expTaskObjectFactory.createFromBackendDict(
        this.newTaskEntryBackendDict('successive_incorrect_answers'))
    ).toBeInstanceOf(SuccessiveIncorrectAnswersTask);
  });

  it('should build a new resolved exloration task', () => {
    const task = expTaskObjectFactory.createNewResolvedTask(
      'eid', 1, 'high_bounce_rate', 'Introduction');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetId).toEqual('Introduction');
    expect(task.isResolved()).toBeTrue();
  });

  it('should build a new obsolete exloration task', () => {
    const task = expTaskObjectFactory.createNewObsoleteTask(
      'eid', 1, 'high_bounce_rate', 'Introduction');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetId).toEqual('Introduction');
    expect(task.isObsolete()).toBeTrue();
  });

  it('should throw an error if task type is unknown', () => {
    expect(
      () => expTaskObjectFactory.createFromBackendDict(
        this.newTaskEntryBackendDict('unknown_task_type'))
    ).toThrowError('unsupported task type: unknown_task_type');
  });
});
