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

import {LearnerAnswerInfoObjectFactory} from
  'domain/statistics/LearnerAnswerInfoObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class LearnerAnswerDetailsObjectFactory {
  expId: string;
  stateName: string;
  interactionId: string;
  customizationArgs: any;
  learnerAnswerInfoData: LearnerAnswerInfoObjectFactory[];

  constructor(
      expId: string, stateName: string, interactionId: string,
      customizationArgs: any,
      learnerAnswerInfoData: LearnerAnswerInfoObjectFactory[]) {
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

  getLearnerAnswerInfoData(): LearnerAnswerInfoObjectFactory[] {
    return this.learnerAnswerInfoData;
  }

  static createDefaultLearnerAnswerDetails(
      expId: string, stateName: string, interactionId: string,
      customizationArgs: any,
      learnerAnswerInfoData: LearnerAnswerInfoObjectFactory[]): (
    LearnerAnswerDetailsObjectFactory) {
    return new LearnerAnswerDetailsObjectFactory(
      expId, stateName, interactionId, customizationArgs,
      learnerAnswerInfoData);
  }
}

angular.module('oppia').factory(
  'LearnerAnswerDetailsObjectFactory',
  downgradeInjectable(LearnerAnswerDetailsObjectFactory));
