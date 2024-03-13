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

/**
 * @fileoverview Tests for short learner group summary model.
 */

import {ShortLearnerGroupSummary} from './short-learner-group-summary.model';

describe('Short Learner Group Summary', () => {
  it('should correctly convert backend dict to object', () => {
    let sampleShortLearnerGroupSummaryDict = {
      id: 'sampleId',
      title: 'sampleTitle',
      description: 'sampleDescription',
      facilitator_usernames: ['username1'],
      learners_count: 5,
    };

    let sampleShortLearnerGroupSummary =
      ShortLearnerGroupSummary.createFromBackendDict(
        sampleShortLearnerGroupSummaryDict
      );

    expect(sampleShortLearnerGroupSummary.id).toEqual('sampleId');
    expect(sampleShortLearnerGroupSummary.title).toEqual('sampleTitle');
    expect(sampleShortLearnerGroupSummary.description).toEqual(
      'sampleDescription'
    );
    expect(sampleShortLearnerGroupSummary.facilitatorUsernames).toEqual([
      'username1',
    ]);
    expect(sampleShortLearnerGroupSummary.learnersCount).toEqual(5);
  });
});
