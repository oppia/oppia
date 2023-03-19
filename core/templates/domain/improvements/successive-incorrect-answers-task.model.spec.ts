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
 * @fileoverview Unit tests for the SuccessiveIncorrectAnswersTaskModel.
 */

import { SuccessiveIncorrectAnswersTask } from
  'domain/improvements/successive-incorrect-answers-task.model';

describe('Successive incorrect answers task model', function() {
  it('should return new task if there are playthroughs demonstrating ' +
    'multiple incorrect submissions', () => {
    const task = SuccessiveIncorrectAnswersTask.createNew(
      'eid', 1, 'Introduction', 3);

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('successive_incorrect_answers');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toEqual(
      'At least 3 learners had quit after entering many incorrect answers at ' +
      'this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should be resolvable', () => {
    const task = SuccessiveIncorrectAnswersTask.createNew(
      'eid', 1, 'Introduction', 1);

    expect(task.isOpen()).toBeTrue();
    expect(task.isResolved()).toBeFalse();

    task.resolve();
    expect(task.isOpen()).toBeFalse();
    expect(task.isResolved()).toBeTrue();
  });

  it('should return obsolete task if all answers are addressed', () => {
    const task = SuccessiveIncorrectAnswersTask.createNew(
      'eid', 1, 'Introduction', 0);

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('successive_incorrect_answers');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toBeNull();
    expect(task.isObsolete()).toBeTrue();
  });

  it('should create from an IFL task backend dict', () => {
    const task = (
      SuccessiveIncorrectAnswersTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'successive_incorrect_answers',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: (
          'At least 3 learners had quit after entering many incorrect ' +
          'answers at this card.'),
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      }));

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('successive_incorrect_answers');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription()).toEqual(
      'At least 3 learners had quit after entering many incorrect answers at ' +
      'this card.');
    expect(task.isOpen()).toBeTrue();
  });

  it('should throw when backend dict entity type is not exploration', () => {
    expect(
      () => SuccessiveIncorrectAnswersTask.createFromBackendDict({
        entity_type: '???',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'successive_incorrect_answers',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: (
          'At least 3 learners had quit after entering many incorrect ' +
          'answers at this card.'),
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has entity_type "???" but expected "exploration"');
  });

  it('should throw when backend dict task type is not IFL', () => {
    expect(
      () => SuccessiveIncorrectAnswersTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        // This throws "Type '"???"' is not assignable to type
        // '"successive_incorrect_answers"'.". We need to suppress this error
        // because 'task_type' should be equal to 'successive_incorrect_answers'
        // but we set it to an invalid value in order to test validations.
        // @ts-expect-error
        task_type: '???',
        target_type: 'state',
        target_id: 'Introduction',
        issue_description: (
          'At least 3 learners had quit after entering many incorrect ' +
          'answers at this card.'),
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError(
      'backend dict has task_type "???" but expected ' +
      '"successive_incorrect_answers"'
    );
  });

  it('should throw when backend dict target type is not state', () => {
    expect(
      () => SuccessiveIncorrectAnswersTask.createFromBackendDict({
        entity_type: 'exploration',
        entity_id: 'eid',
        entity_version: 1,
        task_type: 'successive_incorrect_answers',
        target_type: '???',
        target_id: 'Introduction',
        issue_description: (
          'At least 3 learners had quit after entering many incorrect ' +
          'answers at this card.'),
        status: 'open',
        resolver_username: null,
        resolved_on_msecs: null,
      })
    ).toThrowError('backend dict has target_type "???" but expected "state"');
  });

  it('should not change issue description after it is generated', () => {
    const task = SuccessiveIncorrectAnswersTask.createNew(
      'eid', 1, 'Introduction', 0);
    expect(task.getIssueDescription()).toBeNull();

    task.refreshStatus(7);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after entering many incorrect answers at ' +
      'this card.');

    task.refreshStatus(0);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after entering many incorrect answers at ' +
      'this card.');

    task.refreshStatus(3);
    expect(task.getIssueDescription()).toEqual(
      'At least 7 learners had quit after entering many incorrect answers at ' +
      'this card.');
  });
});
