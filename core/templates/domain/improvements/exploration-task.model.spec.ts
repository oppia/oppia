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
 * @fileoverview Unit tests for the ExplorationTaskModel.
 */

import {
  ExplorationTaskBackendDict,
  ExplorationTaskModel,
} from 'domain/improvements/exploration-task.model';
import {HighBounceRateTask} from 'domain/improvements/high-bounce-rate-task.model';
import {TaskEntryBackendDict} from 'domain/improvements/task-entry.model';
import {IneffectiveFeedbackLoopTask} from 'domain/improvements/ineffective-feedback-loop-task.model';
import {NeedsGuidingResponsesTask} from 'domain/improvements/needs-guiding-response-task.model';
import {SuccessiveIncorrectAnswersTask} from 'domain/improvements/successive-incorrect-answers-task.model';

describe('Exploration task model', () => {
  let newTaskEntryBackendDict: {
    (taskType: string): TaskEntryBackendDict<string>;
  };

  beforeEach(() => {
    newTaskEntryBackendDict = (taskType: string): TaskEntryBackendDict => ({
      entity_type: 'exploration',
      entity_id: 'eid',
      entity_version: 1,
      task_type: taskType,
      target_type: 'state',
      target_id: 'Introduction',
      issue_description: '20% of learners dropped at this state',
      status: 'resolved',
      resolver_username: 'test_user',
      resolved_on_msecs: 123456789,
    });
  });

  it('should return a high bounce rate task', () => {
    expect(
      ExplorationTaskModel.createFromBackendDict(
        newTaskEntryBackendDict(
          'high_bounce_rate'
        ) as ExplorationTaskBackendDict
      )
    ).toBeInstanceOf(HighBounceRateTask);
  });

  it('should return a ineffective feedback loop task', () => {
    expect(
      ExplorationTaskModel.createFromBackendDict(
        newTaskEntryBackendDict(
          'ineffective_feedback_loop'
        ) as ExplorationTaskBackendDict
      )
    ).toBeInstanceOf(IneffectiveFeedbackLoopTask);
  });

  it('should return a needs guiding responses task', () => {
    expect(
      ExplorationTaskModel.createFromBackendDict(
        newTaskEntryBackendDict(
          'needs_guiding_responses'
        ) as ExplorationTaskBackendDict
      )
    ).toBeInstanceOf(NeedsGuidingResponsesTask);
  });

  it('should return a successive incorrect answers task', () => {
    expect(
      ExplorationTaskModel.createFromBackendDict(
        newTaskEntryBackendDict(
          'successive_incorrect_answers'
        ) as ExplorationTaskBackendDict
      )
    ).toBeInstanceOf(SuccessiveIncorrectAnswersTask);
  });

  it('should build a new resolved exloration task', () => {
    const task = ExplorationTaskModel.createNewResolvedTask(
      'eid',
      1,
      'high_bounce_rate',
      'Introduction'
    );
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetId).toEqual('Introduction');
    expect(task.isResolved()).toBeTrue();
  });

  it('should build a new obsolete exloration task', () => {
    const task = ExplorationTaskModel.createNewObsoleteTask(
      'eid',
      1,
      'high_bounce_rate',
      'Introduction'
    );
    expect(task.entityId).toEqual('eid');
    expect(task.entityVersion).toEqual(1);
    expect(task.taskType).toEqual('high_bounce_rate');
    expect(task.targetId).toEqual('Introduction');
    expect(task.isObsolete()).toBeTrue();
  });

  it('should throw an error if task type is unknown', () => {
    expect(() =>
      ExplorationTaskModel.createFromBackendDict(
        newTaskEntryBackendDict(
          'unknown_task_type'
        ) as ExplorationTaskBackendDict
      )
    ).toThrowError(
      new RegExp(
        'Unsupported task type "unknown_task_type" for backend dict: ' +
          '{.*"task_type":"unknown_task_type".*}'
      )
    );
  });
});
