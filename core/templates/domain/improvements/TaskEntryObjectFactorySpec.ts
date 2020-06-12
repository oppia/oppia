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
 * @fileoverview TODO
 */

import { TestBed } from '@angular/core/testing';

import { TaskEntry, TaskEntryObjectFactory } from
  'domain/improvements/TaskEntryObjectFactory';

describe('Task entry', function() {
  let taskEntryObjectFactory: TaskEntryObjectFactory = null;
  let mockDate = new Date(2020, 6, 12, 17, 18, 33);
  beforeEach(() => {
    taskEntryObjectFactory = TestBed.get(TaskEntryObjectFactory);
  });

  it('should use same values from backend dict', () => {
    const task: TaskEntry = taskEntryObjectFactory.createFromBackendDict({
      task_type: 'high_bounce_rate',
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      closed_by: 'uuid',
      closed_on_msecs: mockDate.getTime(),
    });

    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.issueDescription)
      .toEqual('20% of learners dropped at this state');
    expect(task.isOpen()).toBeFalse();
    expect(task.getClosedBy()).toEqual('uuid');
    expect(task.getClosedOnMsecs()).toEqual(mockDate.getTime());
  });

  it('should create a new task from input arguments', () => {
    const task: TaskEntry = taskEntryObjectFactory.createNew(
      'high_bounce_rate', 'state', 'Introduction',
      '20% of learners dropped at this state', 'resolved', 'uuid',
      mockDate.getTime());

    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetType).toEqual('state');
    expect(task.targetId).toEqual('Introduction');
    expect(task.issueDescription)
      .toEqual('20% of learners dropped at this state');
    expect(task.isOpen()).toBeTrue();
    expect(task.getClosedBy()).toBeNull();
    expect(task.getClosedOnMsecs()).toBeNull();
  });

  it('should create an open task by default', () => {
    const task: TaskEntry = taskEntryObjectFactory.createNew(
      'high_bounce_rate', 'state', 'Introduction',
      '20% of learners dropped at this state');

    expect(task.isOpen()).toBeTrue();
    expect(task.getClosedBy()).toBeNull();
    expect(task.getClosedOnMsecs()).toBeNull();
  });

  describe('Status management', () => {
    beforeEach(() => {
      jasmine.clock().mockDate(mockDate);

      this.task = taskEntryObjectFactory.createNew(
        'high_bounce_rate', 'state', 'Introduction',
        '20% of learners dropped at this state');
    });

    it('should capture current datetime when resolved', () => {
      this.task.resolve('uuid');

      expect(this.task.isOpen()).toBeFalse();
      expect(this.task.getClosedBy()).toEqual('uuid');
      expect(this.task.getClosedOnMsecs()).toEqual(mockDate.getTime());
    });

    it('should clear out closing details when re-opened', () => {
      this.task.resolve('uuid');
      expect(this.task.isOpen()).toBeFalse();
      expect(this.task.getClosedBy()).not.toBeNull();
      expect(this.task.getClosedOnMsecs()).not.toBeNull();

      this.task.open();
      expect(this.task.isOpen()).toBeTrue();
      expect(this.task.getClosedBy()).toBeNull();
      expect(this.task.getClosedOnMsecs()).toBeNull();
    });

    it('should not be open after discarding', () => {
      this.task.discard();

      expect(this.task.isOpen()).toBeFalse();
    });
  });
});
