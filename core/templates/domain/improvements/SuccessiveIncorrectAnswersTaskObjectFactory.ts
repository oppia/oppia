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
 * @fileoverview Domain object for a successive incorrect answers improvements
 *    task.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ITaskEntryBackendDict, TaskEntry } from
  'domain/improvements/TaskEntryObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

export class SuccessiveIncorrectAnswersTask extends TaskEntry<
    'successive_incorrect_answers'> {
  constructor(
      backendDict: ITaskEntryBackendDict<'successive_incorrect_answers'>) {
    if (backendDict.entity_type !==
            ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION) {
      throw new Error(
        `backend dict has entity_type "${backendDict.entity_type}" ` +
        `but expected "${ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION}"`);
    }
    if (backendDict.task_type !==
            ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS) {
      throw new Error(
        `backend dict has task_type "${backendDict.task_type}" but expected ` +
        `"${ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS}"`);
    }
    if (backendDict.target_type !==
            ImprovementsConstants.TASK_TARGET_TYPE_STATE) {
      throw new Error(
        `backend dict has target_type "${backendDict.target_type}" ` +
        `but expected "${ImprovementsConstants.TASK_TARGET_TYPE_STATE}"`);
    }
    super(backendDict);
  }

  public resolve(): void {
    this.markAsResolved();
  }

  public refreshStatus(
      numMultipleIncorrectSubmissionsPlaythroughs: number): void {
    if (this.isObsolete() && numMultipleIncorrectSubmissionsPlaythroughs > 0) {
      this.generateIssueDescription(
        numMultipleIncorrectSubmissionsPlaythroughs);
      this.markAsOpen();
    }
  }

  private generateIssueDescription(
      numMultipleIncorrectSubmissionsPlaythroughs: number): void {
    this.issueDescription = (
      `At least ${numMultipleIncorrectSubmissionsPlaythroughs} learners had ` +
      'quit after entering many incorrect answers at this card.');
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuccessiveIncorrectAnswersTaskObjectFactory {
  private createNewObsoleteTask(
      expId: string, expVersion: number, stateName: string
  ): SuccessiveIncorrectAnswersTask {
    return new SuccessiveIncorrectAnswersTask({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: ImprovementsConstants.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_OBSOLETE,
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });
  }

  createNew(
      expId: string, expVersion: number, stateName: string,
      numMultipleIncorrectSubmissionsPlaythroughs: number
  ): SuccessiveIncorrectAnswersTask {
    const task = this.createNewObsoleteTask(expId, expVersion, stateName);
    task.refreshStatus(numMultipleIncorrectSubmissionsPlaythroughs);
    return task;
  }

  createFromBackendDict(
      backendDict: ITaskEntryBackendDict<'successive_incorrect_answers'>
  ): SuccessiveIncorrectAnswersTask {
    return new SuccessiveIncorrectAnswersTask(backendDict);
  }
}

angular.module('oppia').factory(
  'SuccessiveIncorrectAnswersTaskObjectFactory',
  downgradeInjectable(SuccessiveIncorrectAnswersTaskObjectFactory));
