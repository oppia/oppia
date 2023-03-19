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
 * @fileoverview Frontend Model for exploration improvement tasks.
 */

import { HighBounceRateTask } from 'domain/improvements/high-bounce-rate-task.model';
import { TaskEntryBackendDict } from 'domain/improvements/task-entry.model';
import { ImprovementsConstants } from 'domain/improvements/improvements.constants';
import {
  IneffectiveFeedbackLoopTask
} from 'domain/improvements/ineffective-feedback-loop-task.model';
import {
  NeedsGuidingResponsesTask
} from 'domain/improvements/needs-guiding-response-task.model';
import {
  SuccessiveIncorrectAnswersTask
} from 'domain/improvements/successive-incorrect-answers-task.model';

export type ExplorationTaskType = (
  'high_bounce_rate' |
  'ineffective_feedback_loop' |
  'needs_guiding_responses' |
  'successive_incorrect_answers');

export type ExplorationTaskBackendDict = (
  TaskEntryBackendDict<'high_bounce_rate'> |
  TaskEntryBackendDict<'ineffective_feedback_loop'> |
  TaskEntryBackendDict<'needs_guiding_responses'> |
  TaskEntryBackendDict<'successive_incorrect_answers'>);

export type ExplorationTask = (
  HighBounceRateTask |
  IneffectiveFeedbackLoopTask |
  NeedsGuidingResponsesTask |
  SuccessiveIncorrectAnswersTask);

export class ExplorationTaskModel {
  static createNewObsoleteTask(
      expId: string, expVersion: number, taskType: ExplorationTaskType,
      stateName: string): ExplorationTask {
    return ExplorationTaskModel.createFromBackendDict({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: taskType,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_OBSOLETE,
      resolver_username: null,
      resolved_on_msecs: null,
    });
  }

  static createNewResolvedTask(
      expId: string, expVersion: number, taskType: ExplorationTaskType,
      stateName: string): ExplorationTask {
    return ExplorationTaskModel.createFromBackendDict({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: taskType,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_RESOLVED,
      resolver_username: null,
      resolved_on_msecs: null,
    });
  }

  static createFromBackendDict(
      backendDict: ExplorationTaskBackendDict): ExplorationTask {
    const taskType = backendDict.task_type;
    switch (backendDict.task_type) {
      case 'high_bounce_rate':
        return HighBounceRateTask.createFromBackendDict(backendDict);
      case 'ineffective_feedback_loop':
        return IneffectiveFeedbackLoopTask.createFromBackendDict(backendDict);
      case 'needs_guiding_responses':
        return NeedsGuidingResponsesTask.createFromBackendDict(backendDict);
      case 'successive_incorrect_answers':
        return SuccessiveIncorrectAnswersTask.createFromBackendDict(
          backendDict);
      default: {
        const invalidBackendDict: never = backendDict;
        throw new Error(
          `Unsupported task type "${taskType}" for backend dict: ` +
          JSON.stringify(invalidBackendDict));
      }
    }
  }
}
