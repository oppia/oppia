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
 * @fileoverview Domain object for a needs guiding responses improvements task.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerStats } from 'domain/exploration/AnswerStatsObjectFactory';
import { ITaskEntryBackendDict, TaskEntry } from
  'domain/improvements/TaskEntryObjectFactory';
import { ImprovementsConstants } from
  'domain/improvements/improvements.constants';

export class NeedsGuidingResponsesTask extends TaskEntry {
  constructor(backendDict: ITaskEntryBackendDict) {
    if (backendDict.entity_type !==
            ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION) {
      throw new Error(
        `backend dict has entity_type "${backendDict.entity_type}" ` +
        `but expected "${ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION}"`);
    }
    if (backendDict.task_type !==
            ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES) {
      throw new Error(
        `backend dict has task_type "${backendDict.task_type}" but expected ` +
        `"${ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES}"`);
    }
    if (backendDict.target_type !==
            ImprovementsConstants.TASK_TARGET_TYPE_STATE) {
      throw new Error(
        `backend dict has target_type "${backendDict.target_type}" ` +
        `but expected "${ImprovementsConstants.TASK_TARGET_TYPE_STATE}"`);
    }
    super(backendDict);
  }

  public refreshStatus(topStateAnswersStats: AnswerStats[]): void {
    const numUnaddressedTopStateAnswers = (
      topStateAnswersStats.filter(a => !a.isAddressed).length);
    if (numUnaddressedTopStateAnswers === 0) {
      if (this.isOpen()) {
        this.markAsResolved();
      }
    } else {
      if (this.isObsolete()) {
        this.generateIssueDescription(numUnaddressedTopStateAnswers);
      }
      this.markAsOpen();
    }
  }

  private generateIssueDescription(
      numUnaddressedTopStateAnswers: number): void {
    this.issueDescription = (
      `${numUnaddressedTopStateAnswers} of the top 10 answers for this card ` +
      'did not have explicit feedback from Oppia.');
  }
}

@Injectable({
  providedIn: 'root'
})
export class NeedsGuidingResponsesTaskObjectFactory {
  private createNewObsoleteTask(
      expId: string, expVersion: number, stateName: string
  ): NeedsGuidingResponsesTask {
    return new NeedsGuidingResponsesTask({
      entity_type: ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
      entity_id: expId,
      entity_version: expVersion,
      task_type: ImprovementsConstants.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
      target_type: ImprovementsConstants.TASK_TARGET_TYPE_STATE,
      target_id: stateName,
      issue_description: null,
      status: ImprovementsConstants.TASK_STATUS_OBSOLETE,
      resolver_username: null,
      resolver_profile_picture_data_url: null,
      resolved_on_msecs: null,
    });
  }

  createFromAnswerStats(
      expId: string, expVersion: number, stateName: string,
      answerStats: AnswerStats[]): NeedsGuidingResponsesTask {
    const task = this.createNewObsoleteTask(expId, expVersion, stateName);
    task.refreshStatus(answerStats);
    return task;
  }

  createFromBackendDict(
      backendDict: ITaskEntryBackendDict): NeedsGuidingResponsesTask {
    return new NeedsGuidingResponsesTask(backendDict);
  }
}

angular.module('oppia').factory(
  'NeedsGuidingResponsesTaskObjectFactory',
  downgradeInjectable(NeedsGuidingResponsesTaskObjectFactory));
