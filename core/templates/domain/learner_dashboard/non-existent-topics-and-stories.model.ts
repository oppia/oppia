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
 * @fileoverview Frontend model for the number of non existent
 * topics and stories.
 */

export interface NonExistentTopicsAndStoriesBackendDict {
  'partially_learnt_topics': number;
  'completed_stories': number;
  'learnt_topics': number;
  'topics_to_learn': number;
}

export class NonExistentTopicsAndStories {
  constructor(
    public partiallyLearntTopics: number,
    public completedStories: number,
    public learntTopics: number,
    public topicsToLearn: number
  ) { }

  static createFromBackendDict(
      backendDict: NonExistentTopicsAndStoriesBackendDict):
      NonExistentTopicsAndStories {
    return new NonExistentTopicsAndStories(
      backendDict.partially_learnt_topics,
      backendDict.completed_stories,
      backendDict.learnt_topics,
      backendDict.topics_to_learn);
  }
}
