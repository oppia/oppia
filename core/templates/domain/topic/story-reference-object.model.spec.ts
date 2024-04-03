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
 * @fileoverview Tests for StoryReference.
 */

import {StoryReference} from 'domain/topic/story-reference-object.model';

describe('Story reference model', () => {
  let _sampleStoryReference: StoryReference;

  beforeEach(() => {
    var sampleStoryReferenceBackendObject = {
      story_id: 'story_id',
      story_is_published: true,
    };

    _sampleStoryReference = StoryReference.createFromBackendDict(
      sampleStoryReferenceBackendObject
    );
  });

  it('should get all story reference fields', () => {
    expect(_sampleStoryReference.getStoryId()).toEqual('story_id');
    expect(_sampleStoryReference.isStoryPublished()).toEqual(true);
  });

  it('should correctly create default story reference', () => {
    var storyReference = StoryReference.createFromStoryId('story_id_2');
    expect(storyReference.getStoryId()).toEqual('story_id_2');
    expect(storyReference.isStoryPublished()).toEqual(false);
  });
});
