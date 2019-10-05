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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story reference domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

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
}

@Injectable({
  providedIn: 'root'
})
export class StoryReferenceObjectFactory {
  createFromBackendDict(
      // TODO(#7176): Replace 'any' with the exact type. This has been kept as
      // 'any' because 'classifierData' is a dict with underscore_cased keys
      // which give tslint errors against underscore_casing in favor of
      // camelCasing.
      storyReferenceBackendDict: any): StoryReference {
    return new StoryReference(
      storyReferenceBackendDict.story_id,
      storyReferenceBackendDict.story_is_published);
  }

  createFromStoryId(storyId: string): StoryReference {
    return new StoryReference(storyId, false);
  }
}

angular.module('oppia').factory(
  'StoryReferenceObjectFactory',
  downgradeInjectable(StoryReferenceObjectFactory));
