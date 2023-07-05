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
 * @fileoverview Unit tests for NewlyCreatedStoryModel.
 */

import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';

describe('Newly Created Story Model', () => {
  let story: NewlyCreatedStory;

  beforeEach(() => {
    story = NewlyCreatedStory.createDefault();
  });

  it('should create a new default story', () => {
    expect(story.description).toEqual('');
    expect(story.title).toEqual('');
  });

  it('should validate the new story fields', () => {
    // Fails when title, description, and url fragment are empty.
    expect(story.isValid()).toBe(false);

    // Fails when description is valid but title and url fragment are empty.
    story.description = 'story description';
    expect(story.isValid()).toBe(false);

    // Fails when title is valid but description and url fragment are empty.
    story.title = 'storyName1';
    story.description = '';
    expect(story.isValid()).toBe(false);

    // Fails when url fragment is valid but description and title are empty.
    story.title = '';
    story.description = '';
    story.urlFragment = 'story-fragment';
    expect(story.isValid()).toBe(false);

    // Fails when title and description are valid but url fragment is empty.
    story.title = 'storyName1';
    story.description = 'story description';
    story.urlFragment = '';
    expect(story.isValid()).toBe(false);

    // Fails when url fragment and description are valid but title is empty.
    story.title = '';
    story.description = 'story description';
    story.urlFragment = 'story-fragment';
    expect(story.isValid()).toBe(false);

    // Fails when title and url fragment are valid but description is empty.
    story.title = 'storyName1';
    story.description = '';
    story.urlFragment = 'story-fragment';
    expect(story.isValid()).toBe(false);

    // Fails when url fragment has invalid characters.
    story.title = 'storyName1';
    story.description = 'story description';
    story.urlFragment = 'story Fragment';
    expect(story.isValid()).toBe(false);

    // Passes when title, description, and url fragment are valid.
    story.title = 'storyName1';
    story.description = 'story description';
    story.urlFragment = 'story-fragment';
    expect(story.isValid()).toBe(true);
  });
});
