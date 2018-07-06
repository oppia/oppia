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
    var skillIdToDescriptionDict = {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    };
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject, skillIdToDescriptionDict);
  }));

  it('should not find issues with a valid topic', function() {
    var issues = _sampleTopic.validate();
    expect(issues).toEqual([]);
  });

  it('should validate the topic', function() {
    _sampleTopic.setName('');
    _sampleTopic.addCanonicalStoryId('story_2');
    _sampleTopic.getSubtopics()[0].addSkill('skill_1');

    var issues = _sampleTopic.validate();
    expect(issues).toEqual([
      'Topic name should not be empty.',
      'The story with id story_2 is present in both canonical ' +
      'and additional stories.',
      'The skill with id skill_1 is duplicated in the topic'
    ]);
  });

  it('should be able to create an interstitial topic object', function() {
    var topic = TopicObjectFactory.createInterstitialTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getLanguageCode()).toBe('en');
    expect(topic.getSubtopics()).toEqual([]);
    expect(topic.getAdditionalStoryIds()).toEqual([]);
    expect(topic.getCanonicalStoryIds()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
  });

  it('should correctly remove the various array elements', function() {
    _sampleTopic.removeCanonicalStoryId('story_1');
    _sampleTopic.removeAdditionalStoryId('story_2');
    _sampleTopic.removeUncategorizedSkill('skill_1');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_3']);
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4']);
    expect(_sampleTopic.getUncategorizedSkillSummaries().length).toEqual(1);
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getId()
    ).toEqual('skill_2');
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getDescription()
    ).toEqual('Description 2');
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
    }, {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    });

    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).not.toEqual(secondTopic);

    _sampleTopic.copyFromTopic(secondTopic);
    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).toEqual(secondTopic);
  });
});
