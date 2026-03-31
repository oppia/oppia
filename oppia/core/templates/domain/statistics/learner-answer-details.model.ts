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
 * @fileoverview Factory model for frontend learner answer info
 */

import {LearnerAnswerInfo} from 'domain/statistics/learner-answer-info.model';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';

export class LearnerAnswerDetails {
  expId: string;
  stateName: string;
  interactionId: string;
  customizationArgs: InteractionCustomizationArgs;
  learnerAnswerInfoData: LearnerAnswerInfo[];

  constructor(
    expId: string,
    stateName: string,
    interactionId: string,
    customizationArgs: InteractionCustomizationArgs,
    learnerAnswerInfoData: LearnerAnswerInfo[]
  ) {
    this.expId = expId;
    this.stateName = stateName;
    this.interactionId = interactionId;
    this.customizationArgs = customizationArgs;
    this.learnerAnswerInfoData = learnerAnswerInfoData;
  }

  static createDefaultLearnerAnswerDetails(
    expId: string,
    stateName: string,
    interactionId: string,
    customizationArgs: InteractionCustomizationArgs,
    learnerAnswerInfoData: LearnerAnswerInfo[]
  ): LearnerAnswerDetails {
    return new LearnerAnswerDetails(
      expId,
      stateName,
      interactionId,
      customizationArgs,
      learnerAnswerInfoData
    );
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
    var createdOnValues = this.learnerAnswerInfoData.map(info =>
      info.getCreatedOn()
    );
    return Math.max(...createdOnValues);
  }
}
