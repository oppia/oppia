// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for NewlyCreatedStoryObjectFactory.
 */

import { NewlyCreatedStory, NewlyCreatedStoryObjectFactory } from
  'domain/topic/NewlyCreatedStoryObjectFactory';

describe('Newly Created Story Object Factory', () => {
  let newlyCreatedStoryObjectFactory: NewlyCreatedStoryObjectFactory = null;
  let story: NewlyCreatedStory = null;

  beforeEach(() => {
    newlyCreatedStoryObjectFactory = new NewlyCreatedStoryObjectFactory();
    story = newlyCreatedStoryObjectFactory.createDefault();
  });

  it('should create a new default story', () => {
    expect(story.description).toEqual('');
    expect(story.title).toEqual('');
  });

  it('should validate the new story fields', () => {
    expect(story.isValid()).toBe(false);

    story.description = 'story description';
    expect(story.isValid()).toBe(false);

    story.title = 'storyName1';
    expect(story.isValid()).toBe(false);

    story.description = '';
    expect(story.isValid()).toBe(false);

    story.description = 'story description';
    expect(story.isValid()).toBe(false);

    story.urlFragment = '';
    expect(story.isValid()).toBe(false);

    story.urlFragment = 'story Fragment';
    expect(story.isValid()).toBe(false);

    story.urlFragment = 'story-fragment';
    expect(story.isValid()).toBe(true);
  });
});
