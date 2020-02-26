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

export interface LearnerAnswerInfoBackendDict {
  id: string;
  answer: string;
  /* eslint-disable camelcase */
  answer_details: string;
  created_on: number;
  /* eslint-enable camelcase */
}

export class LearnerAnswerInfo {
  _id: string;
  _answer: string;
  _answerDetails: string;
  _createdOn: number;

  constructor(
      learnerAnswerInfoId: string, answer: string, answerDetails: string,
      createdOn: number) {
    this._id = learnerAnswerInfoId;
    this._answer = answer;
    this._answerDetails = answerDetails;
    this._createdOn = createdOn;
  }

  getId(): string {
    return this._id;
  }

  getAnswer(): string {
    return this._answer;
  }

  getAnswerDetails(): string {
    return this._answerDetails;
  }

  getCreatedOn(): number {
    return this._createdOn;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LearnerAnswerInfoObjectFactory {
  createDefaultLearnerAnswerInfo(
      answer: string, answerDetails: string): LearnerAnswerInfo {
    return new LearnerAnswerInfo(
      null, answer, answerDetails, null);
  }

  createFromBackendDict(
      learnerAnswerInfoDict: LearnerAnswerInfoBackendDict): LearnerAnswerInfo {
    return new LearnerAnswerInfo(
      learnerAnswerInfoDict.id,
      learnerAnswerInfoDict.answer,
      learnerAnswerInfoDict.answer_details,
      learnerAnswerInfoDict.created_on
    );
  }
}

angular.module('oppia').factory(
  'LearnerAnswerInfoObjectFactory',
  downgradeInjectable(LearnerAnswerInfoObjectFactory));
