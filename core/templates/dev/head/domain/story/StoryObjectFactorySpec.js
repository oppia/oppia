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
 * @fileoverview Tests for StoryObjectFactory.
 */

describe('Story object factory', function() {
  var StoryObjectFactory = null;
  var _sampleStory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    StoryObjectFactory = $injector.get('StoryObjectFactory');

    var sampleStoryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Notes',
      version: 1,
      story_contents: {
        initial_node_id: 'node_1',
        nodes: [{
          id: 'node_1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    _sampleStory = StoryObjectFactory.createFromBackendDict(
      sampleStoryBackendDict);
  }));

  it('should be able to create an interstitial story object', function() {
    var story = StoryObjectFactory.createInterstitialStory();
    expect(story.getId()).toEqual(null);
    expect(story.getTitle()).toEqual('Story title loading');
    expect(story.getDescription()).toEqual('Story description loading');
    expect(story.getLanguageCode()).toBe('en');
    expect(story.getStoryContents()).toEqual(null);
    expect(story.getNotes()).toEqual('Story notes loading');
  });

  it('should correctly validate a valid story', function() {
    expect(_sampleStory.validate()).toEqual([]);
  });

  it('should correctly validate a story', function() {
    _sampleStory.setTitle('');
    expect(_sampleStory.validate()).toEqual([
      'Story title should not be empty'
    ]);
  });

  it('should be able to copy from another story', function() {
    var secondStory = StoryObjectFactory.createFromBackendDict({
      id: 'sample_story_id_2s',
      title: 'Story title 2',
      description: 'Story description 2',
      notes: 'Notes 2',
      version: 1,
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [{
          id: 'node_2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    });

    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).not.toEqual(secondStory);

    _sampleStory.copyFromStory(secondStory);
    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).toEqual(secondStory);
  });
});
