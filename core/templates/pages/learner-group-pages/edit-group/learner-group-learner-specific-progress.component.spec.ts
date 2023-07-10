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
 * @fileoverview Unit tests for learner group preferences tab.
 */

import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NavigationService } from 'services/navigation.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupLearnerSpecificProgressComponent } from './learner-group-learner-specific-progress.component';
import { ChapterProgressSummary } from 'domain/exploration/chapter-progress-summary.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockNavigationService {
  openSubmenu(evt: KeyboardEvent, menuName: string): void {}
}

describe('LearnerGroupLearnerSpecificProgressComponent', () => {
  let component: LearnerGroupLearnerSpecificProgressComponent;
  let fixture: ComponentFixture<LearnerGroupLearnerSpecificProgressComponent>;
  let storyViewerBackendApiService: StoryViewerBackendApiService;

  const sampleLearnerGroupSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5
  };

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
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null
  };
  const sampleStorySummaryBackendDict = {
    id: 'sample_story_id',
    title: 'Story title',
    node_titles: ['Chapter 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    description: 'Description',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-url-fragment',
    all_node_dicts: [nodeDict],
    topic_name: 'Topic one',
    topic_url_fragment: 'topic-one',
    classroom_url_fragment: 'math'
  };
  const sampleStorySummaryBackendDict2 = {
    id: 'story_id_1',
    title: 'Story Title 2',
    description: 'Story Description 2',
    node_titles: ['Chapter 2', 'Chapter 3'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 2'],
    url_fragment: 'some-story-title',
    all_node_dicts: [],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic'
  };

  const sampleLearnerGroupUserProgDict = {
    username: 'username2',
    progress_sharing_is_turned_on: true,
    stories_progress: [
      sampleStorySummaryBackendDict, sampleStorySummaryBackendDict2],
    subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict]
  };
  const sampleLearnerGroupUserProg = (
    LearnerGroupUserProgress.createFromBackendDict(
      sampleLearnerGroupUserProgDict)
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupLearnerSpecificProgressComponent,
        MockTranslatePipe,
        MockTrunctePipe
      ],
      providers: [
        {
          provide: NavigationService,
          useClass: MockNavigationService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    storyViewerBackendApiService = TestBed.inject(
      StoryViewerBackendApiService);
    fixture = TestBed.createComponent(
      LearnerGroupLearnerSpecificProgressComponent);
    component = fixture.componentInstance;

    component.learnerProgress = sampleLearnerGroupUserProg;
  });

  it('should initialize', fakeAsync(() => {
    const chapterProgressSummaryDict = {
      total_checkpoints_count: 6,
      visited_checkpoints_count: 4
    };
    const chaptersProgress = ChapterProgressSummary.createFromBackendDict(
      chapterProgressSummaryDict);

    spyOn(storyViewerBackendApiService, 'fetchProgressInStoriesChapters')
      .and.returnValue(Promise.resolve([chaptersProgress]));

    component.ngOnInit();
    tick(100);

    expect(component.topicNames).toEqual(['parentTopicName']);
    expect(component.cummulativeStoryChaptersCount).toEqual(
      [1, 3]);
  }));

  it('should set active tab and check if tab is active correctly', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .PROGRESS_IN_STORIES);

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .PROGRESS_IN_STORIES);

    let tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .PROGRESS_IN_STORIES);
    expect(tabIsActive).toBeTrue();

    tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .SKILLS_ANALYSIS);
    expect(tabIsActive).toBeFalse();
  });

  it('should get all checkpoints progress of chapter correctly',
    fakeAsync(() => {
      const chapterProgressSummaryDict1 = {
        total_checkpoints_count: 6,
        visited_checkpoints_count: 4
      };
      const chapterProgressSummaryDict2 = {
        total_checkpoints_count: 4,
        visited_checkpoints_count: 3
      };

      const chaptersProgress1 = ChapterProgressSummary.createFromBackendDict(
        chapterProgressSummaryDict1);
      const chaptersProgress2 = ChapterProgressSummary.createFromBackendDict(
        chapterProgressSummaryDict2);

      spyOn(storyViewerBackendApiService, 'fetchProgressInStoriesChapters')
        .and.returnValue(Promise.resolve(
          [chaptersProgress1, chaptersProgress2, chaptersProgress2]));

      component.ngOnInit();
      tick(100);

      let checkpointsProgress = component.getAllCheckpointsProgressOfChapter(
        0, 0);
      expect(checkpointsProgress).toEqual([1, 1, 1, 1, 1, 1]);

      checkpointsProgress = component.getAllCheckpointsProgressOfChapter(1, 1);
      expect(checkpointsProgress).toEqual([1, 1, 2, 0]);
    })
  );

  it('should check whether chapter is completed correctly', () => {
    component.learnerProgress = sampleLearnerGroupUserProg;

    let chapterIsCompleted = component.isChapterCompleted(0, 0);
    expect(chapterIsCompleted).toBeTrue();

    chapterIsCompleted = component.isChapterCompleted(1, 1);
    expect(chapterIsCompleted).toBeFalse();
  });

  it('should get completed chapter progress bar width correctly', () => {
    spyOn(component, 'getAllCheckpointsProgressOfChapter').and.returnValues(
      [1, 1, 1, 2, 0, 0], [1, 2, 0, 0, 0]);
    component.learnerProgress = sampleLearnerGroupUserProg;

    let progressWidth = component.getCompletedProgressBarWidth(0, 0);
    expect(progressWidth).toBe(50);

    progressWidth = component.getCompletedProgressBarWidth(1, 1);
    expect(progressWidth).toBe(12.5);
  });

  it('should get visited checkpoints count of chapter correctly', () => {
    spyOn(component, 'getAllCheckpointsProgressOfChapter').and.returnValues(
      [1, 1, 1, 2, 0, 0], [1, 2, 0, 0, 0], [0, 0, 0], [1, 1, 1]);
    component.learnerProgress = sampleLearnerGroupUserProg;

    let visitedCheckpointsCount = component.getVisitedCheckpointsCount(0, 0);
    expect(visitedCheckpointsCount).toBe(4);

    visitedCheckpointsCount = component.getVisitedCheckpointsCount(0, 1);
    expect(visitedCheckpointsCount).toBe(2);

    visitedCheckpointsCount = component.getVisitedCheckpointsCount(1, 1);
    expect(visitedCheckpointsCount).toBe(0);

    visitedCheckpointsCount = component.getVisitedCheckpointsCount(0, 2);
    expect(visitedCheckpointsCount).toBe(3);
  });

  it('should get count of subtopics learner is struggling with correctly',
    () => {
      component.learnerProgress = sampleLearnerGroupUserProg;

      let strugglingSubtopicsCount = component.getStrugglingWithSubtopicsCount(
        'parentTopicName');
      expect(strugglingSubtopicsCount).toBe(1);
    }
  );

  it('should get user profile image data url correctly', () => {
    const dataUrl = '%2Fimages%2Furl%2F1';
    expect(component.getProfileImageDataUrl(dataUrl)).toBe('/images/url/1');
  });
});
