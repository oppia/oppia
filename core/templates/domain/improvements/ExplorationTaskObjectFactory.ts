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
} from './IneffectiveFeedbackLoopTaskObjectFactory';
import {
  NeedsGuidingResponsesTask,
  NeedsGuidingResponsesTaskObjectFactory
} from 'domain/improvements/NeedsGuidingResponsesTaskObjectFactory';
import {
  SuccessiveIncorrectAnswersTask,
  SuccessiveIncorrectAnswersTaskObjectFactory
} from 'domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory';

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

  createFromBackendDict(backendDict: ITaskEntryBackendDict): ExplorationTask {
    switch (backendDict.task_type) {
      case ImprovementsConstants.TASK_TYPE_HIGH_BOUNCE_RATE:
        return this.hbrTaskObjectFactory.createFromBackendDict(backendDict);
      case ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP:
        return this.iflTaskObjectFactory.createFromBackendDict(backendDict);
      case ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES:
        return this.ngrTaskObjectFactory.createFromBackendDict(backendDict);
      case ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS:
        return this.siaTaskObjectFactory.createFromBackendDict(backendDict);
      default:
        throw new Error(
          'Backend dict does not match any known task type: ' +
          JSON.stringify(backendDict));
    }
  }
}

angular.module('oppia').factory(
  'ExplorationTaskObjectFactory',
  downgradeInjectable(ExplorationTaskObjectFactory));
