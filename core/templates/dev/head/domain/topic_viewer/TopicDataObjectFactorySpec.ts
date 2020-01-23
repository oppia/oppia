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
 * @fileoverview Tests for TopicDataObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { TopicData, TopicDataObjectFactory } from
  'domain/topic_viewer/TopicDataObjectFactory';

describe('Topic Data Object Factory', () => {
  let topicDataObjectFactory: TopicDataObjectFactory;
  let _sampleTopicData: TopicData;

  beforeEach(() => {
    topicDataObjectFactory = new TopicDataObjectFactory();

    let sampleTopicDataDict = {
      topic_name: 'topic_name',
      topic_id: 'topic_id',
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
      }],
      additional_story_dicts: [{
        id: '1',
        title: 'Story Title',
        description: 'Story Description',
      }],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [{
        skill_ids: ['skill_id_2'],
        id: 1,
        title: 'subtopic_name'
      }],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };

    _sampleTopicData = topicDataObjectFactory.createFromBackendDict(
      sampleTopicDataDict);
  });

  it('should get the values as expected', () => {
    expect(_sampleTopicData.getTopicName()).toEqual('topic_name');
    expect(_sampleTopicData.getTopicId()).toEqual('topic_id');

    expect(_sampleTopicData.getCanonicalStories()[0]).toEqual({
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
    });

    expect(_sampleTopicData.getAdditionalStories()[0]).toEqual({
      id: '1',
      title: 'Story Title',
      description: 'Story Description',
    });

    expect(_sampleTopicData.getUncategorizedSkillIds()[0]).toEqual(
      'skill_id_1');

    expect(_sampleTopicData.getSubtopics()[0]).toEqual({
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name'
    });

    expect(_sampleTopicData.getDegreesOfMastery()).toEqual({
      skill_id_1: 0.5,
      skill_id_2: 0.3
    });

    expect(_sampleTopicData.getSkillDescriptions()).toEqual({
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2'
    });
  });
});
