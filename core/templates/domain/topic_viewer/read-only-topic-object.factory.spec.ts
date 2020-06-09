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
 * @fileoverview Tests for ReadOnlyTopicObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ReadOnlyTopic, ReadOnlyTopicObjectFactory } from
  'domain/topic_viewer/read-only-topic-object.factory';
import { SkillSummaryObjectFactory } from
  'domain/skill/SkillSummaryObjectFactory';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';

describe('Read only topic object Factory', () => {
  let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory = null;
  let _sampleReadOnlyTopic: ReadOnlyTopic = null;

  beforeEach(() => {
    readOnlyTopicObjectFactory = new ReadOnlyTopicObjectFactory(
      new SubtopicObjectFactory(new SkillSummaryObjectFactory()),
      new SkillSummaryObjectFactory());

    let sampleTopicDataDict = {
      topic_name: 'topic_name',
      topic_id: 'topic_id',
      topic_description: 'Topic description',
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        published: true
      }],
      additional_story_dicts: [{
        id: '1',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        published: true
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
      },
      train_tab_should_be_displayed: false
    };

    _sampleReadOnlyTopic = readOnlyTopicObjectFactory.createFromBackendDict(
      sampleTopicDataDict);
  });

  it('should return correct values of topic name, description and id', () => {
    expect(_sampleReadOnlyTopic.getTopicName()).toEqual('topic_name');
    expect(
      _sampleReadOnlyTopic.getTopicDescription()).toEqual('Topic description');
    expect(_sampleReadOnlyTopic.getTopicId()).toEqual('topic_id');
    expect(_sampleReadOnlyTopic.getTrainTabShouldBeDisplayed()).toEqual(false);
  });

  it('should return correct value of uncategorized skill summary object',
    () => {
      expect(_sampleReadOnlyTopic.getUncategorizedSkillsSummaries()[0].getId())
        .toEqual('skill_id_1');
      expect(_sampleReadOnlyTopic.getUncategorizedSkillsSummaries()[0]
        .getDescription()).toEqual('Skill Description 1');
    });

  it('should return correct values of subtopic object', () => {
    expect(_sampleReadOnlyTopic.getSubtopics()[0].getId()).toEqual(1);
    expect(_sampleReadOnlyTopic.getSubtopics()[0].getTitle()).toEqual(
      'subtopic_name');
    expect(_sampleReadOnlyTopic.getSubtopics()[0]._skillSummaries[0].getId())
      .toEqual('skill_id_2');
    expect(_sampleReadOnlyTopic.getSubtopics()[0]._skillSummaries[0]
      .getDescription()).toEqual('Skill Description 2');
  });

  it('should return correct values of skill descriptions', () => {
    expect(_sampleReadOnlyTopic.getSkillDescriptions()).toEqual({
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2'
    });
  });

  it('should return correct values of canonical stories', () => {
    expect(_sampleReadOnlyTopic.getCanonicalStorySummaries()[0].getId())
      .toEqual('0');
    expect(_sampleReadOnlyTopic.getCanonicalStorySummaries()[0].getTitle())
      .toEqual('Story Title');
    expect(_sampleReadOnlyTopic.getCanonicalStorySummaries()[0]
      .getDescription()).toEqual('Story Description');
    expect(_sampleReadOnlyTopic.getCanonicalStorySummaries()[0].getNodeTitles())
      .toEqual(['Chapter 1']);
  });

  it('should return correct values of additional stories', () => {
    expect(_sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getId())
      .toEqual('1');
    expect(_sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getTitle())
      .toEqual('Story Title');
    expect(_sampleReadOnlyTopic.getAdditionalStorySummaries()[0]
      .getDescription()).toEqual('Story Description');
    expect(_sampleReadOnlyTopic.getAdditionalStorySummaries()[0]
      .getNodeTitles()).toEqual(['Chapter 1']);
  });

  it('should return the correct value of degrees for skills', () => {
    expect(_sampleReadOnlyTopic.getDegreesOfMastery()).toEqual({
      skill_id_1: 0.5,
      skill_id_2: 0.3
    });
  });
});
