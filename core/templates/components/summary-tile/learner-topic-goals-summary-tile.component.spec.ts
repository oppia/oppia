// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerTopicGoalsSummaryTileComponent.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LearnerTopicGoalsSummaryTileComponent} from './learner-topic-goals-summary-tile.component';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {StoryNode} from 'domain/story/story-node.model';

describe('Learner Topic Goals Summary Tile Component', () => {
  let component: LearnerTopicGoalsSummaryTileComponent;
  let fixture: ComponentFixture<LearnerTopicGoalsSummaryTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [LearnerTopicGoalsSummaryTileComponent],
      providers: [UrlInterpolationService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerTopicGoalsSummaryTileComponent);
    component = fixture.componentInstance;

    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
    };
    let nodeDict1 = {
      id: 'node_1',
      thumbnail_filename: 'image1.png',
      title: 'Chapter 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_1',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };
    let nodeDict2 = {
      id: 'node_2',
      thumbnail_filename: 'image2.png',
      title: 'Chapter 2',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_2',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };
    const learnerTopicSummaryBackendDict1 = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 2,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom_name: 'math',
      classroom_url_fragment: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [
        {
          id: '0',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1', 'Chapter 2'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 2'],
          all_node_dicts: [nodeDict1, nodeDict2],
          url_fragment: 'story-title',
          topic_name: 'Topic Name',
          classroom_url_fragment: 'math',
          topic_url_fragment: 'topic-name',
        },
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };
    component.topicSummary = LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1
    );
    fixture.detectChanges();
  });

  it(
    'should get # as story node link url if all chapters' + ' are read',
    () => {
      component.storyNodeToDisplay = StoryNode.createFromIdAndTitle(
        '1',
        'Story node title'
      );
      let storyNodeLink = component.getStoryNodeLink();
      fixture.detectChanges();
      expect(storyNodeLink).toBe('#');
    }
  );

  it('should get the story and story node title on init', () => {
    component.ngOnInit();
    expect(component.storyNodeTitle).toEqual('Chapter 1');
    expect(component.storyName).toEqual('Story Title');
  });

  it('should make the tile blurred if it is hovered', () => {
    component.cardIsHovered = true;
    expect(component.isCardHovered()).toBe(
      '-webkit-filter: blur(2px); filter: blur(2px);'
    );
  });

  it(
    'should get story node link url for exploration page if unread' +
      ' chapters are present in topic',
    () => {
      let storyNodeLink =
        '/explore/exp_1?topic_url_fragment=topic-name&' +
        'classroom_url_fragment=math&story_url_fragment=story-title&' +
        'node_id=node_1';
      component.ngOnInit();
      expect(component.getStoryNodeLink()).toBe(storyNodeLink);
    }
  );
});
