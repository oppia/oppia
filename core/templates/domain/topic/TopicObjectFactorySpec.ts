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

import { TestBed } from '@angular/core/testing';

import { Topic, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';

describe('Topic object factory', () => {
  let topicObjectFactory: TopicObjectFactory;
  let _sampleTopic: Topic;

  beforeEach(() => {
    topicObjectFactory = TestBed.get(TopicObjectFactory);

    let sampleTopicBackendObject = {
      id: 'sample_topic_id',
      name: 'Topic name',
      abbreviated_name: 'abbrev',
      thumbnail_filename: 'img.png',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1', 'skill_2'],
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }, {
        story_id: 'story_4',
        story_is_published: false
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }, {
        story_id: 'story_3',
        story_is_published: false
      }],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3']
      }],
      next_subtopic_id: 1,
      language_code: 'en'
    };
    let skillIdToDescriptionDict = {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    };
    _sampleTopic = topicObjectFactory.create(
      sampleTopicBackendObject, skillIdToDescriptionDict);
  });

  it('should not find issues with a valid topic', () => {
    expect(_sampleTopic.validate()).toEqual([]);
  });

  it('should validate the topic', () => {
    _sampleTopic.setName('');
    _sampleTopic.setAbbreviatedName(''),
    _sampleTopic.addCanonicalStory('story_2');
    _sampleTopic.getSubtopics()[0].addSkill('skill_1', '');

    expect(_sampleTopic.validate()).toEqual([
      'Topic name should not be empty.',
      'Abbreviated name should not be empty.',
      'The story with id story_2 is present in both canonical ' +
      'and additional stories.',
      'The skill with id skill_1 is duplicated in the topic'
    ]);
  });

  it('should be able to create an interstitial topic object', () => {
    let topic = topicObjectFactory.createInterstitialTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getLanguageCode()).toBe('en');
    expect(topic.getSubtopics()).toEqual([]);
    expect(topic.getAdditionalStoryReferences()).toEqual([]);
    expect(topic.getCanonicalStoryReferences()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
  });

  it('should correctly remove the various array elements', () => {
    _sampleTopic.removeCanonicalStory('story_1');
    _sampleTopic.removeAdditionalStory('story_2');
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

  it('should be able to copy from another topic', () => {
    let secondTopic = topicObjectFactory.create({
      id: 'topic_id_2',
      name: 'Another name',
      description: 'Another description',
      language_code: 'en',
      version: '15',
      canonical_story_references: [{
        story_id: 'story_10',
        story_is_published: true
      }],
      additional_story_references: [{
        story_id: 'story_5',
        story_is_published: true
      }],
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
