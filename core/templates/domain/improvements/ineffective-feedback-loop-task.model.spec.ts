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
 * @fileoverview Unit tests for the IneffectiveFeedbackLoopTaskModel.
 */

import {IneffectiveFeedbackLoopTask} from 'domain/improvements/ineffective-feedback-loop-task.model';

describe('Ineffective feedback loop task model', function () {
  it(
    'should return new task if there are playthroughs demonstrating cyclic ' +
      'state transitions',
    () => {
      const task = IneffectiveFeedbackLoopTask.createNew(
        'eid',
        1,
        'Introduction',
        3
      );

      expect(task.entityType).toEqual('exploration');
      expect(task.entityId).toEqual('eid');
      expect(task.entityVersion).toEqual(1);
      expect(task.taskType).toEqual('ineffective_feedback_loop');
      expect(task.targetType).toEqual('state');
      expect(task.targetId).toEqual('Introduction');
      expect(task.getIssueDescription()).toEqual(
        'At least 3 learners had quit after revisiting this card several times.'
      );
      expect(task.isOpen()).toBeTrue();
    }
  );

  it('should return obsolete task if all answers are addressed', () => {
    const task = IneffectiveFeedbackLoopTask.createNew(
      'eid',
      1,
      'Introduction',
      0
    );

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('ineffective_feedback_loop');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toBeNull();
    expect(task.isObsolete()).toBeTrue();
  });

  it('should be resolvable', () => {
    const task = IneffectiveFeedbackLoopTask.createNew(
      'eid',
      1,
      'Introduction',
      1
    );

    expect(task.isOpen()).toBeTrue();
    expect(task.isResolved()).toBeFalse();

    task.resolve();
    expect(task.isOpen()).toBeFalse();
    expect(task.isResolved()).toBeTrue();
  });

  it('should create from an IFL task backend dict', () => {
    const task = IneffectiveFeedbackLoopTask.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'ineffective_feedback_loop',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description:
        'At least 3 learners had quit after revisiting this card several ' +
        'times.',
      status: 'open',
      resolver_username: null,
      resolved_on_msecs: null,
    });

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('ineffective_feedback_loop');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toEqual(
      'At least 3 learners had quit after revisiting this card several times.'
    );
    expect(task.isOpen()).toBeTrue();
  });

  it('should throw when backend dict entity type is not exploration', () => {
    expect(() =>
      IneffectiveFeedbackLoopTask.createFromBackendDict({
        entity_type: '???',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'ineffective_feedback_loop',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description:
          'At least 3 learners had quit after revisiting this card several ' +
          'times.',
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has entity_type "???" but expected "exploration"'
    );
  });

  it('should throw when backend dict task type is not IFL', () => {
    expect(() =>
      IneffectiveFeedbackLoopTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        // This throws "Type '"???"' is not assignable to type
        // '"ineffective_feedback_loop"'.". We need to suppress this error
        // because 'task_type' should be equal to 'ineffective_feedback_loop'
        // but we set it to an invalid value in order to test validations.
        // @ts-expect-error
        task_type: '???',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description:
          'At least 3 learners had quit after revisiting this card several ' +
          'times.',
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has task_type "???" but expected ' +
        '"ineffective_feedback_loop"'
    );
  });

  it('should throw when backend dict target type is not state', () => {
    expect(() =>
      IneffectiveFeedbackLoopTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'ineffective_feedback_loop',
        target_type: '???',
        target_id: 'Introduction',
        issue_description:
          'At least 3 learners had quit after revisiting this card several ' +
          'times.',
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError('backend dict has target_type "???" but expected "state"');
  });

  it('should not change issue description after it is generated', () => {
    const task = IneffectiveFeedbackLoopTask.createNew(
      'eid',
      1,
      'Introduction',
      0
    );
    expect(task.getIssueDescription()).toBeNull();

    task.refreshStatus(7);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after revisiting this card several times.'
    );

    task.refreshStatus(0);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after revisiting this card several times.'
    );

    task.refreshStatus(3);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after revisiting this card several times.'
    );
  });
});
