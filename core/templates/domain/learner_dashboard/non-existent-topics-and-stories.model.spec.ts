// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for NonExistentTopicsAndStories.
 */

import { NonExistentTopicsAndStories } from
  'domain/learner_dashboard/non-existent-topics-and-stories.model';

describe('Non existent topics and stories model', () => {
  it('should correctly convert backend dict to object', () => {
    let backendDict = {
      partially_learnt_topics: 1,
      completed_stories: 2,
      learnt_topics: 3,
      topics_to_learn: 4,
    };

    let object = NonExistentTopicsAndStories.createFromBackendDict(backendDict);

    expect(object.partiallyLearntTopics).toEqual(1);
    expect(object.completedStories).toEqual(2);
    expect(object.learntTopics).toEqual(3);
    expect(object.topicsToLearn).toEqual(4);
  });
});
