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
 * @fileoverview Tests for LearnerAnswerDetail.
 */

import {LearnerAnswerDetails} from 'domain/statistics/learner-answer-details.model';
import {LearnerAnswerInfo} from 'domain/statistics/learner-answer-info.model';

describe('Learner answer details model', () => {
  it('should create a default learner answer details object', () => {
    var learnerAnswerInfo = LearnerAnswerInfo.createDefaultLearnerAnswerInfo(
      'This is answer',
      'This is answer details'
    );
    var learnerAnswerDetails =
      LearnerAnswerDetails.createDefaultLearnerAnswerDetails(
        'fakeExpId',
        'fakeStateName',
        'fakeInteractionId',
        'fakeCustomizationArgs',
        [learnerAnswerInfo]
      );

    expect(learnerAnswerDetails.getExpId()).toEqual('fakeExpId');
    expect(learnerAnswerDetails.getStateName()).toEqual('fakeStateName');
    expect(learnerAnswerDetails.getLearnerAnswerInfoData()).toEqual([
      learnerAnswerInfo,
    ]);
    expect(learnerAnswerDetails.getLastUpdatedTime()).toBe(0);
  });
});

describe('A LearnerAnswerInfoObject', () => {
  it(
    'should give a lastUpdatedTime as the created_on of its latest ' +
      'learnerAnswerInfo',
    () => {
      var testLaiDict1 = {
        id: 'test_1',
        answer: 'Answer 1',
        answer_details: 'Answer details one.',
        created_on: 20191119.2002,
      };

      var testLaiDict2 = {
        id: 'test_2',
        answer: 'Answer 2',
        answer_details: 'Answer details two.',
        created_on: 20191119.2004,
      };

      var testLaiDict3 = {
        id: 'test_3',
        answer: 'Answer 3',
        answer_details: 'Answer details three.',
        created_on: 20191119.2001,
      };

      var testLaiDict4 = {
        id: 'test_4',
        answer: 'Answer 4',
        answer_details: 'Answer details four.',
        created_on: 20191119.2003,
      };

      var learnerAnswerDetails =
        LearnerAnswerDetails.createDefaultLearnerAnswerDetails(
          'fakeExpId',
          'fakeStateName',
          'fakeInteractionId',
          'fakeCustomizationArgs',
          [
            LearnerAnswerInfo.createFromBackendDict(testLaiDict1),
            LearnerAnswerInfo.createFromBackendDict(testLaiDict2),
            LearnerAnswerInfo.createFromBackendDict(testLaiDict3),
            LearnerAnswerInfo.createFromBackendDict(testLaiDict4),
          ]
        );

      expect(learnerAnswerDetails.getLastUpdatedTime()).toBe(
        testLaiDict2.created_on
      );
    }
  );
});
