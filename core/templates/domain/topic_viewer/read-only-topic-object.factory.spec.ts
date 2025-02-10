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

import {
  ReadOnlyTopic,
  ReadOnlyTopicObjectFactory,
} from 'domain/topic_viewer/read-only-topic-object.factory';
import {StoryNode} from 'domain/story/story-node.model';

describe('Read only topic object Factory', () => {
  let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory;
  let _sampleReadOnlyTopic: ReadOnlyTopic;

  beforeEach(() => {
    readOnlyTopicObjectFactory = new ReadOnlyTopicObjectFactory();

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };

    let sampleTopicDataDict = {
      topic_name: 'topic_name',
      topic_id: 'topic_id',
      topic_description: 'Topic description',
      canonical_story_dicts: [
        {
          id: '0',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
      ],
      additional_story_dicts: [
        {
          id: '1',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title-one',
          all_node_dicts: [nodeDict],
        },
      ],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [
        {
          skill_ids: ['skill_id_2'],
          id: 1,
          title: 'subtopic_name',
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          url_fragment: 'subtopic-name',
        },
      ],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
      practice_tab_is_displayed: false,
      meta_tag_content: 'Topic meta tag content',
      page_title_fragment_for_web: 'topic page title',
      classroom_name: 'math',
    };

    _sampleReadOnlyTopic =
      readOnlyTopicObjectFactory.createFromBackendDict(sampleTopicDataDict);
  });

  it('should return correct values for read-only topic object', () => {
    expect(_sampleReadOnlyTopic.getTopicName()).toEqual('topic_name');
    expect(_sampleReadOnlyTopic.getTopicDescription()).toEqual(
      'Topic description'
    );
    expect(_sampleReadOnlyTopic.getTopicId()).toEqual('topic_id');
    expect(_sampleReadOnlyTopic.getPracticeTabIsDisplayed()).toEqual(false);
    expect(_sampleReadOnlyTopic.getMetaTagContent()).toEqual(
      'Topic meta tag content'
    );
    expect(_sampleReadOnlyTopic.getPageTitleFragmentForWeb()).toEqual(
      'topic page title'
    );
  });

  it('should return correct value of uncategorized skill summary object', () => {
    expect(
      _sampleReadOnlyTopic.getUncategorizedSkillsSummaries()[0].getId()
    ).toEqual('skill_id_1');
    expect(
      _sampleReadOnlyTopic.getUncategorizedSkillsSummaries()[0].getDescription()
    ).toEqual('Skill Description 1');
  });

  it('should return correct values of subtopic object', () => {
    expect(_sampleReadOnlyTopic.getSubtopics()[0].getId()).toEqual(1);
    expect(_sampleReadOnlyTopic.getSubtopics()[0].getTitle()).toEqual(
      'subtopic_name'
    );
    expect(
      _sampleReadOnlyTopic.getSubtopics()[0]._skillSummaries[0].getId()
    ).toEqual('skill_id_2');
    expect(
      _sampleReadOnlyTopic.getSubtopics()[0]._skillSummaries[0].getDescription()
    ).toEqual('Skill Description 2');
  });

  it('should return correct values of skill descriptions', () => {
    expect(_sampleReadOnlyTopic.getSkillDescriptions()).toEqual({
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2',
    });
  });

  it('should return correct values of canonical stories', () => {
    let expectedStorySummary =
      _sampleReadOnlyTopic.getCanonicalStorySummaries()[0];
    expect(expectedStorySummary.getId()).toEqual('0');
    expect(expectedStorySummary.getTitle()).toEqual('Story Title');
    expect(expectedStorySummary.getDescription()).toEqual('Story Description');
    expect(expectedStorySummary.getNodeTitles()).toEqual(['Chapter 1']);
    expect(expectedStorySummary.isNodeCompleted('Chapter 1')).toEqual(true);
    expect(expectedStorySummary.getAllNodes()).toEqual([
      StoryNode.createFromBackendDict({
        id: 'node_1',
        thumbnail_filename: 'image.png',
        title: 'Title 1',
        description: 'Description 1',
        prerequisite_skill_ids: ['skill_1'],
        acquired_skill_ids: ['skill_2'],
        destination_node_ids: ['node_2'],
        outline: 'Outline',
        exploration_id: null,
        outline_is_finalized: false,
        thumbnail_bg_color: '#a33f40',
        status: 'Published',
        planned_publication_date_msecs: 100.0,
        last_modified_msecs: 100.0,
        first_publication_date_msecs: 200.0,
        unpublishing_reason: null,
      }),
    ]);
  });

  it('should return correct values of additional stories', () => {
    expect(
      _sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getId()
    ).toEqual('1');
    expect(
      _sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getTitle()
    ).toEqual('Story Title');
    expect(
      _sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getDescription()
    ).toEqual('Story Description');
    expect(
      _sampleReadOnlyTopic.getAdditionalStorySummaries()[0].getNodeTitles()
    ).toEqual(['Chapter 1']);
    expect(
      _sampleReadOnlyTopic
        .getAdditionalStorySummaries()[0]
        .isNodeCompleted('Chapter 1')
    ).toEqual(true);
  });

  it('should return the correct value of degrees for skills', () => {
    expect(_sampleReadOnlyTopic.getDegreesOfMastery()).toEqual({
      skill_id_1: 0.5,
      skill_id_2: 0.3,
    });
  });
});
