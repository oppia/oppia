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
 * @fileoverview Unit tests for the public interface of the TaskEntry domain
 *    object.
 */

import { TestBed } from '@angular/core/testing';

import { ITaskEntryBackendDict, TaskEntry, TaskEntryObjectFactory } from
  'domain/improvements/TaskEntryObjectFactory';

describe('Task entry', function() {
  let taskEntryObjectFactory: TaskEntryObjectFactory;

  beforeEach(() => {
    taskEntryObjectFactory = TestBed.get(TaskEntryObjectFactory);
  });

  it('should use same values from backend dict', () => {
    const taskBackendDict: ITaskEntryBackendDict = {
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    };
    const task: TaskEntry = (
      taskEntryObjectFactory.createFromBackendDict(taskBackendDict));

    expect(task.entityType).toEqual('exploration');
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.getIssueDescription())
      .toEqual('20% of learners dropped at this state');
    expect(task.isResolved()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();
    expect(task.isOpen()).toBeFalse();
    expect(task.resolverUsername).toEqual('test_user');
    expect(task.resolverProfilePictureDataUrl).toEqual('./image.png');
    expect(task.resolvedOnMsecs).toEqual(123456789);
  });

  it('should only return relevant values to backend payload dict', () => {
    const task = taskEntryObjectFactory.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    });

    expect(task.toPayloadDict()).toEqual({
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
    });
  });

  it('should be able to become obsolete', () => {
    const task = taskEntryObjectFactory.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'open',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    });
    expect(task.isOpen()).toBeTrue();
    expect(task.isObsolete()).toBeFalse();

    task.markAsObsolete();
    expect(task.isOpen()).toBeFalse();
    expect(task.isObsolete()).toBeTrue();
  });

  it('should be clonable with a new target id', () => {
    const task = taskEntryObjectFactory.createFromBackendDict({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'open',
      resolver_username: 'test_user',
      resolver_profile_picture_data_url: './image.png',
      resolved_on_msecs: 123456789,
    });
    const clonedTask = task.cloneWithNewTarget('End');

    expect(clonedTask.entityType).toEqual(task.entityType);
    expect(clonedTask.entityId).toEqual(task.entityId);
    expect(clonedTask.entityVersion).toEqual(task.entityVersion);
    expect(clonedTask.taskType).toEqual(task.taskType);
    expect(clonedTask.targetType).toEqual(task.targetType);
    expect(clonedTask.targetId).toEqual('End');
    expect(clonedTask.getIssueDescription())
      .toEqual(task.getIssueDescription());
    expect(clonedTask.getStatus()).toEqual(task.getStatus());
    expect(clonedTask.resolverUsername).toEqual(task.resolverUsername);
    expect(clonedTask.resolverProfilePictureDataUrl)
      .toEqual(task.resolverProfilePictureDataUrl);
    expect(clonedTask.resolvedOnMsecs).toEqual(task.resolvedOnMsecs);
  });
});
