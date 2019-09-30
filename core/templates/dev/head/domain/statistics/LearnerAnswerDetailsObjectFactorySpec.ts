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
 * @fileoverview Tests for LearnerAnswerDetailsObjectFactory.
 */

import { LearnerAnswerInfoObjectFactory } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
import { LearnerAnswerDetailsObjectFactory } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';

describe('Learner answer details object factory', () => {
  it('should create a default learner answer details object', () => {
    var learnerAnswerInfo = (
      new LearnerAnswerInfoObjectFactory().createDefaultLearnerAnswerInfo(
        'This is answer', 'This is answer details'));
    var learnerAnswerDetails = (
      new LearnerAnswerDetailsObjectFactory().createDefaultLearnerAnswerDetails(
        'fakeExpId', 'fakeStateName', 'fakeInteractionId',
        'fakeCustomizationArgs', [learnerAnswerInfo]));

    expect(learnerAnswerDetails.getExpId()).toEqual('fakeExpId');
    expect(learnerAnswerDetails.getStateName()).toEqual('fakeStateName');
    expect(learnerAnswerDetails.getLearnerAnswerInfoData()).toEqual(
      [learnerAnswerInfo]);
  });
});
