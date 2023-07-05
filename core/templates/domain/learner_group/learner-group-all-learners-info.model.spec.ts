// Copyright 2022 The Oppia Authors. All Rights Reserved.
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

import { LearnerGroupAllLearnersInfo } from './learner-group-all-learners-info.model';

/**
 * @fileoverview Tests for learner group all learners info model.
 */

describe('Learner Group All Learners Info', () => {
  it('should correctly convert backend dict to object', () => {
    const sampleLearnerGroupAllLearnersInfoDict = {
      learners_info: [{
        username: 'user1',
        error: 'some error message'
      }],
      invited_learners_info: [{
        username: 'user2',
        error: 'some error message'
      }]
    };

    const sampleAllLearnersInfo = (
      LearnerGroupAllLearnersInfo.createFromBackendDict(
        sampleLearnerGroupAllLearnersInfoDict)
    );

    expect(sampleAllLearnersInfo.learnersInfo[0].username).toEqual('user1');
    expect(sampleAllLearnersInfo.learnersInfo[0].error).toEqual(
      'some error message');
    expect(sampleAllLearnersInfo.invitedLearnersInfo[0].username).toEqual(
      'user2');
    expect(sampleAllLearnersInfo.invitedLearnersInfo[0].error).toEqual(
      'some error message');
  });
});
