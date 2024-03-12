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
 * @fileoverview Tests for LearnerAnswerInfo.
 */

import {LearnerAnswerInfo} from 'domain/statistics/learner-answer-info.model';

describe('Learner answer info model', () => {
  it('should create a learner answer info object from a backend dict', () => {
    var learnerAnswerInfoBackendDict = {
      id: 'sample_id',
      answer: 'sample_answer',
      answer_details: 'answer_details',
      created_on: 1000,
    };
    var learnerAnswerInfo = LearnerAnswerInfo.createFromBackendDict(
      learnerAnswerInfoBackendDict
    );
    expect(learnerAnswerInfo.getId()).toEqual('sample_id');
    expect(learnerAnswerInfo.getAnswer()).toEqual('sample_answer');
    expect(learnerAnswerInfo.getAnswerDetails()).toEqual('answer_details');
    expect(learnerAnswerInfo.getCreatedOn()).toEqual(1000);
  });

  it('should create a default learner answer info object', () => {
    var learnerAnswerInfo = LearnerAnswerInfo.createDefaultLearnerAnswerInfo(
      'This is answer',
      'This is answer details'
    );

    expect(learnerAnswerInfo.getId()).toBeNull();
    expect(learnerAnswerInfo.getAnswer()).toEqual('This is answer');
    expect(learnerAnswerInfo.getAnswerDetails()).toEqual(
      'This is answer details'
    );
    expect(learnerAnswerInfo.getCreatedOn()).toBeNull();
  });
});
