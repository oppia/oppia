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
 * @fileoverview Domain object for exploration improvement tasks.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { HighBounceRateTask, HighBounceRateTaskObjectFactory } from
  'domain/improvements/HighBounceRateTaskObjectFactory';
import { ITaskEntryBackendDict } from
  'domain/improvements/TaskEntryObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';
import {
  IneffectiveFeedbackLoopTask,
  IneffectiveFeedbackLoopTaskObjectFactory
} from 'domain/improvements/IneffectiveFeedbackLoopTaskObjectFactory';
import {
  NeedsGuidingResponsesTask,
  NeedsGuidingResponsesTaskObjectFactory
} from 'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import {
  SuccessiveIncorrectAnswersTask,
  SuccessiveIncorrectAnswersTaskObjectFactory
} from 'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';

export type ExplorationTaskType = (
  'high_bounce_rate' |
  'ineffective_feedback_loop' |
  'needs_guiding_responses' |
  'successive_incorrect_answers');

export interface IExplorationTaskBackendDict extends ITaskEntryBackendDict {
  'task_type': ExplorationTaskType;
}

export type ExplorationTask = (
  HighBounceRateTask |
  IneffectiveFeedbackLoopTask |
  NeedsGuidingResponsesTask |
  SuccessiveIncorrectAnswersTask);

@Injectable({
  providedIn: 'root'
})
export class ExplorationTaskObjectFactory {
  constructor(
      private hbrTaskObjectFactory: HighBounceRateTaskObjectFactory,
      private iflTaskObjectFactory: IneffectiveFeedbackLoopTaskObjectFactory,
      private ngrTaskObjectFactory: NeedsGuidingResponsesTaskObjectFactory,
      private siaTaskObjectFactory:
        SuccessiveIncorrectAnswersTaskObjectFactory) {}

  createNewObsoleteTask(
      expId: string, expVersion: number, taskType: ExplorationTaskType,
      stateName: string): ExplorationTask {
    return this.createFromBackendDict({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: taskType,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_OBSOLETE,
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });
  }

  createNewResolvedTask(
      expId: string, expVersion: number, taskType: ExplorationTaskType,
      stateName: string): ExplorationTask {
    return this.createFromBackendDict({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: taskType,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_RESOLVED,
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });
  }

  createFromBackendDict(
      backendDict: IExplorationTaskBackendDict): ExplorationTask {
    switch (backendDict.task_type) {
      case 'high_bounce_rate':
        return this.hbrTaskObjectFactory.createFromBackendDict(backendDict);
      case 'ineffective_feedback_loop':
        return this.iflTaskObjectFactory.createFromBackendDict(backendDict);
      case 'needs_guiding_responses':
        return this.ngrTaskObjectFactory.createFromBackendDict(backendDict);
      case 'successive_incorrect_answers':
        return this.siaTaskObjectFactory.createFromBackendDict(backendDict);
      default: {
        const invalidTaskType: never = backendDict.task_type;
        throw new Error('unsupported task type: ' + invalidTaskType);
      }
    }
  }
}

angular.module('oppia').factory(
  'ExplorationTaskObjectFactory',
  downgradeInjectable(ExplorationTaskObjectFactory));
