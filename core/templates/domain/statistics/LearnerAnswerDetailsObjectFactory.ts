// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of frontend learner answer info
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { LearnerAnswerInfo } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';

export class LearnerAnswerDetails {
  expId: string;
  stateName: string;
  interactionId: string;
  customizationArgs: any;
  learnerAnswerInfoData: LearnerAnswerInfo[];

  constructor(
      expId: string, stateName: string, interactionId: string,
      customizationArgs: any,
      learnerAnswerInfoData: LearnerAnswerInfo[]) {
    this.expId = expId;
    this.stateName = stateName;
    this.interactionId = interactionId;
    this.customizationArgs = customizationArgs;
    this.learnerAnswerInfoData = learnerAnswerInfoData;
  }

  getExpId(): string {
    return this.expId;
  }

  getStateName(): string {
    return this.stateName;
  }

  getLearnerAnswerInfoData(): LearnerAnswerInfo[] {
    return this.learnerAnswerInfoData;
  }

  getLastUpdatedTime(): number {
    var createdOnValues =
      this.learnerAnswerInfoData.map(info => info.getCreatedOn());
    return Math.max(...createdOnValues);
  }
}

@Injectable({
  providedIn: 'root'
})
export class LearnerAnswerDetailsObjectFactory {
  createDefaultLearnerAnswerDetails(
      expId: string, stateName: string, interactionId: string,
      customizationArgs: any,
      learnerAnswerInfoData: LearnerAnswerInfo[]): LearnerAnswerDetails {
    return new LearnerAnswerDetails(
      expId, stateName, interactionId, customizationArgs,
      learnerAnswerInfoData);
  }
}

angular.module('oppia').factory(
  'LearnerAnswerDetailsObjectFactory',
  downgradeInjectable(LearnerAnswerDetailsObjectFactory));
