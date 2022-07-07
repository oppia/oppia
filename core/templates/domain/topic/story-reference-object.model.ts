// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model class for creating and mutating instances of frontend
 * story reference domain objects.
 */

export interface StoryReferenceBackendDict {
  'story_id': string;
  'story_is_published': boolean;
}

export class StoryReference {
  _storyId: string;
  _storyIsPublished: boolean;
  constructor(storyId: string, storyIsPublished: boolean) {
    this._storyId = storyId;
    this._storyIsPublished = storyIsPublished;
  }

  // Returns the story id.
  getStoryId(): string {
    return this._storyId;
  }

  // Returns whether the story is published.
  isStoryPublished(): boolean {
    return this._storyIsPublished;
  }

  static createFromBackendDict(
      storyReferenceBackendDict: StoryReferenceBackendDict): StoryReference {
    return new StoryReference(
      storyReferenceBackendDict.story_id,
      storyReferenceBackendDict.story_is_published);
  }

  static createFromStoryId(storyId: string): StoryReference {
    return new StoryReference(storyId, false);
  }
}
