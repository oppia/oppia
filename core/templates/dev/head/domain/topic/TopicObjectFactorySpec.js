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
 * @fileoverview Tests for TopicObjectFactory.
 */

describe('Topic object factory', function() {
  var TopicObjectFactory = null;
  var _sampleTopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    TopicObjectFactory = $injector.get('TopicObjectFactory');

    var sampleTopicBackendObject = {
      id: 'sample_topic_id',
      name: 'Topic name',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1', 'skill_2'],
      canonical_story_ids: ['story_1', 'story_4'],
      additional_story_ids: ['story_2', 'story_3'],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3']
      }],
      next_subtopic_id: 1,
      language_code: 'en'
    };
    _sampleTopic = TopicObjectFactory.create(sampleTopicBackendObject);
  }));

  it('should correctly remove the various array elements', function() {
    _sampleTopic.removeCanonicalStoryId('story_1');
    _sampleTopic.removeAdditionalStoryId('story_2');
    _sampleTopic.removeUncategorizedSkillId('skill_1');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_3']);
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4']);
    expect(_sampleTopic.getUncategorizedSkillIds()).toEqual(['skill_2']);
  });

  it('should be able to copy from another topic', function() {
    var secondTopic = TopicObjectFactory.create({
      id: 'topic_id_2',
      name: 'Another name',
      description: 'Another description',
      language_code: 'en',
      version: '15',
      additional_story_ids: ['story_10'],
      canonical_story_ids: ['story_5'],
      uncategorized_skill_ids: ['skill_2', 'skill_3'],
      next_subtopic_id: 2,
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_1']
      }]
    });

    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).not.toEqual(secondTopic);

    _sampleTopic.copyFromTopic(secondTopic);
    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).toEqual(secondTopic);
  });
});
