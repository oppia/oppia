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
 * @fileoverview Tests for Story model class.
 */

import {Story} from 'domain/story/story.model';

describe('Story object factory', () => {
  let _sampleStory: Story;

  beforeEach(() => {
    var sampleStoryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Notes',
      version: 1,
      corresponding_topic_id: 'topic_id',
      story_contents: {
        initial_node_id: 'node_1',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            description: 'Description',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            thumbnail_filename: 'img.png',
            thumbnail_bg_color: '#a33f40',
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
      url_fragment: 'story-title',
      meta_tag_content: 'story meta tag content',
    };
    _sampleStory = Story.createFromBackendDict(
      // This throws "Argument of type '{ id: string; ... }'
      // is not assignable to parameter of type 'StoryBackendDict'.".
      // We need to suppress this error because 'sampleStoryBackendDict'
      // should have a property 'thumbnail' but we didn't add that property in
      // order to test validations.
      // @ts-expect-error
      sampleStoryBackendDict
    );
  });

  it('should correctly validate a valid story', () => {
    expect(_sampleStory.validate()).toEqual([]);
  });

  it('should correctly prepublish validate a story', () => {
    _sampleStory.setMetaTagContent('a'.repeat(200));
    expect(_sampleStory.prepublishValidate()).toEqual([
      'Story should have a thumbnail.',
      'Story meta tag content should not be longer than 160 characters.',
    ]);
    _sampleStory.setThumbnailFilename('image.png');
    _sampleStory.setThumbnailBgColor('#F8BF74');
    _sampleStory.setMetaTagContent('');
    expect(_sampleStory.prepublishValidate()).toEqual([
      'Story should have meta tag content.',
    ]);
    _sampleStory.setMetaTagContent('abc');
    expect(_sampleStory.prepublishValidate()).toEqual([]);
  });

  it('should correctly validate a story with empty title', () => {
    _sampleStory.setTitle('');
    expect(_sampleStory.validate()).toEqual([
      'Story title should not be empty',
    ]);
  });

  it('should fail validation for empty url fragment', () => {
    _sampleStory.setUrlFragment('');
    expect(_sampleStory.validate()).toEqual([
      'Url Fragment should not be empty.',
    ]);
  });

  it('should fail validation for invalid url fragment', () => {
    _sampleStory.setUrlFragment(' aBc inv4lid-');
    expect(_sampleStory.validate()).toEqual([
      'Url Fragment contains invalid characters. ' +
        'Only lowercase words separated by hyphens are allowed.',
    ]);
  });

  it('should fail validation for lengthy url fragment', () => {
    _sampleStory.setUrlFragment('abcde-abcde-abcde-abcde-abcde-abcde-abcde');
    expect(_sampleStory.validate()).toEqual([
      'Url Fragment should not be greater than 30 characters',
    ]);
  });

  it('should be able to copy from another story', () => {
    var secondStory = Story.createFromBackendDict({
      id: 'sample_story_id_2s',
      title: 'Story title 2',
      description: 'Story description 2',
      notes: 'Notes 2',
      version: 1,
      corresponding_topic_id: 'topic_id_2',
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_2',
            title: 'Title 2',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false,
            description: 'Description',
            thumbnail_filename: 'img.png',
            thumbnail_bg_color: '#a33f40',
            status: 'Published',
            planned_publication_date_msecs: 100.0,
            last_modified_msecs: 100.0,
            first_publication_date_msecs: 200.0,
            unpublishing_reason: null,
          },
        ],
        next_node_id: 'node_3',
      },
      language_code: 'en',
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'story',
      meta_tag_content: 'story meta tag content',
    });

    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).not.toEqual(secondStory);

    _sampleStory.copyFromStory(secondStory);
    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).toEqual(secondStory);
  });
});
