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
 * @fileoverview Unit tests for view learner group assigned syllabus tab.
 */

import {NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LearnerGroupSyllabusBackendApiService} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerGroupSubtopicSummary} from 'domain/learner_group/learner-group-subtopic-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {LearnerGroupViewAssignedSyllabusComponent} from './learner-group-view-assigned-syllabus.component';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {LearnerGroupUserProgress} from 'domain/learner_group/learner-group-user-progress.model';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('LearnerGroupViewAssignedSyllabusComponent', () => {
  let component: LearnerGroupViewAssignedSyllabusComponent;
  let fixture: ComponentFixture<LearnerGroupViewAssignedSyllabusComponent>;
  let assetsBackendApiService: AssetsBackendApiService;
  let learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService;

  const sampleSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5,
    parent_topic_url_fragment: 'topic_1',
    classroom_url_fragment: 'classroom_1',
  };
  const sampleLearnerGroupSubtopicSummary =
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict
    );

  const sampleSubtopicSummaryDict2 = {
    subtopic_id: 0,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.6,
    parent_topic_url_fragment: 'topic_1',
    classroom_url_fragment: undefined,
  };
  const sampleLearnerGroupSubtopicSummary2 =
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict2
    );

  const nodeDict1 = {
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
  const sampleStorySummaryBackendDict = {
    id: 'story_id_0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-title',
    all_node_dicts: [nodeDict1],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };
  const sampleStorySummary = StorySummary.createFromBackendDict(
    sampleStorySummaryBackendDict
  );

  const sampleStorySummaryBackendDict2 = {
    id: 'story_id_1',
    title: 'Story Title 2',
    description: 'Story Description 2',
    node_titles: ['Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 2'],
    url_fragment: 'some-story-title',
    all_node_dicts: [],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };
  const learnerProgressDict = {
    username: 'user1',
    progress_sharing_is_turned_on: true,
    stories_progress: [
      sampleStorySummaryBackendDict,
      sampleStorySummaryBackendDict2,
    ],
    subtopic_pages_progress: [
      sampleSubtopicSummaryDict,
      sampleSubtopicSummaryDict2,
    ],
  };
  const mockLearnerProgress =
    LearnerGroupUserProgress.createFromBackendDict(learnerProgressDict);

  const learnerGroupBackendDict = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator_username'],
    learner_usernames: [],
    invited_learner_usernames: ['username1'],
    subtopic_page_ids: ['topicId1:1'],
    story_ids: ['story_id_0'],
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupViewAssignedSyllabusComponent,
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService
    );
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    fixture = TestBed.createComponent(
      LearnerGroupViewAssignedSyllabusComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.learnerGroup = learnerGroup;
  });

  it('should determine if displayed item is a story or a subtopic', () => {
    expect(component.isDisplayedItemStory('story-2')).toBe(true);
    expect(component.isDisplayedItemStory('subtopic-2')).toBe(false);
    expect(component.isDisplayedItemSubtopic('story-2')).toBe(false);
    expect(component.isDisplayedItemSubtopic('subtopic-2')).toBe(true);
  });

  it('should determine index of syllabus item to display', () => {
    expect(component.getIndexToDisplay('story-2')).toBe(2);
    expect(component.getIndexToDisplay('subtopic-5')).toBe(5);
  });

  it('should initialize', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchLearnerSpecificProgressInAssignedSyllabus'
    ).and.returnValue(Promise.resolve(mockLearnerProgress));
    expect(component.learnerGroup).toEqual(learnerGroup);

    component.ngOnInit();
    tick();

    expect(component.storySummaries).toEqual(
      mockLearnerProgress.storiesProgress
    );
    expect(component.subtopicSummaries).toEqual(
      mockLearnerProgress.subtopicsProgress
    );
    expect(component.displayOrderOfSyllabusItems).toEqual([
      'story-0',
      'story-1',
      'subtopic-0',
      'subtopic-1',
    ]);
  }));

  it('should get subtopic thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/topic/thumbnail/url'
    );

    expect(
      component.getSubtopicThumbnailUrl(sampleLearnerGroupSubtopicSummary)
    ).toEqual('/topic/thumbnail/url');
  });

  it('should get story thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/story/thumbnail/url'
    );

    expect(component.getStoryThumbnailUrl(sampleStorySummary)).toEqual(
      '/story/thumbnail/url'
    );
  });

  it('should get circular progress', () => {
    let cssStyle = component.calculateCircularProgressCss(0);
    expect(cssStyle).toEqual(
      'linear-gradient(90deg, transparent 50%, #CCCCCC 50%)' +
        ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)'
    );

    cssStyle = component.calculateCircularProgressCss(60);
    expect(cssStyle).toEqual(
      'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        'linear-gradient(-54deg, #00645C 50%, #CCCCCC 50%)'
    );
  });

  it('should get story progress correctly', () => {
    let progress = component.getProgressOfStory(sampleStorySummary);
    expect(progress).toEqual(100);
  });

  it('should get story link correctly', () => {
    expect(component.getStoryLink(sampleStorySummary)).toBe(
      '/learn/math/topic/story/story-title'
    );
  });

  it(
    'should get # as story link url when classroom or topic url is not ' +
      'present',
    () => {
      const sampleStorySummaryBackendDict = {
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [],
        topic_name: 'Topic',
        classroom_url_fragment: undefined,
        topic_url_fragment: 'topic',
      };
      const storySummary = StorySummary.createFromBackendDict(
        sampleStorySummaryBackendDict
      );

      expect(component.getStoryLink(storySummary)).toBe('#');
    }
  );

  it('should get practice session link correctly', () => {
    expect(
      component.getPracticeSessionLink(sampleLearnerGroupSubtopicSummary)
    ).toBe(
      '/learn/classroom_1/topic_1/practice/session?' +
        'selected_subtopic_ids=%5B1%5D'
    );
  });

  it(
    'should get # as practice link url when classroom or topic url is not ' +
      'present',
    () => {
      expect(
        component.getPracticeSessionLink(sampleLearnerGroupSubtopicSummary2)
      ).toBe('#');
    }
  );

  it('should get subtopic mastery level correctly', () => {
    const sampleSubtopicSummary3 = new LearnerGroupSubtopicSummary(
      'topicId1',
      'topic name',
      3,
      'sub title',
      'filename',
      '#F8BF74',
      0.85
    );
    const sampleSubtopicSummary4 = new LearnerGroupSubtopicSummary(
      'topicId1',
      'topic name',
      4,
      'sub title',
      'filename4',
      '#F8BF74',
      1
    );
    const sampleSubtopicSummary5 = new LearnerGroupSubtopicSummary(
      'topicId1',
      'topic name',
      4,
      'sub title',
      'filename4',
      '#F8BF74'
    );

    let masteryLevel = component.getSubtopicMasteryLevel(
      sampleLearnerGroupSubtopicSummary
    );
    expect(masteryLevel).toBe('I18N_SKILL_LEVEL_NEEDS_WORK');

    masteryLevel = component.getSubtopicMasteryLevel(
      sampleLearnerGroupSubtopicSummary2
    );
    expect(masteryLevel).toBe('I18N_SKILL_LEVEL_BEGINNER');

    masteryLevel = component.getSubtopicMasteryLevel(sampleSubtopicSummary3);
    expect(masteryLevel).toBe('I18N_SKILL_LEVEL_INTERMEDIATE');

    masteryLevel = component.getSubtopicMasteryLevel(sampleSubtopicSummary4);
    expect(masteryLevel).toBe('I18N_SKILL_LEVEL_PROFICIENT');

    masteryLevel = component.getSubtopicMasteryLevel(sampleSubtopicSummary5);
    expect(masteryLevel).toBe(
      'I18N_LEARNER_GROUP_SYLLABUS_ITEM_NOT_STARTED_YET'
    );
  });

  it('should get story node link correctly', () => {
    let storyNodeLink =
      '/explore/exp_1?topic_url_fragment=topic&' +
      'classroom_url_fragment=math&story_url_fragment=story-title&' +
      'node_id=node_1';

    expect(component.getStoryNodeLink(sampleStorySummary)).toBe(storyNodeLink);
  });

  it(
    'should get # as story node link url when classroom or topic url is ' +
      'not present',
    () => {
      const sampleStorySummaryBackendDict = {
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: [],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict1],
        topic_name: 'Topic',
        classroom_url_fragment: undefined,
        topic_url_fragment: 'topic',
      };
      const storySummary = StorySummary.createFromBackendDict(
        sampleStorySummaryBackendDict
      );

      expect(component.getStoryNodeLink(storySummary)).toBe('#');
    }
  );
});
