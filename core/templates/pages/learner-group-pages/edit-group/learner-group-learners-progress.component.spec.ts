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

import {NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NavigationService} from 'services/navigation.service';
import {LearnerGroupSyllabusBackendApiService} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {LearnerGroupLearnersProgressComponent} from './learner-group-learners-progress.component';
import {LearnerGroupUserProgress} from 'domain/learner_group/learner-group-user-progress.model';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {ChapterProgressSummary} from 'domain/exploration/chapter-progress-summary.model';
import {UserService} from 'services/user.service';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockNavigationService {
  openSubmenu(evt: KeyboardEvent, menuName: string): void {}
}

describe('LearnerGroupLearnersProgressComponent', () => {
  let component: LearnerGroupLearnersProgressComponent;
  let fixture: ComponentFixture<LearnerGroupLearnersProgressComponent>;
  let learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService;
  let navigationService: NavigationService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let userService: UserService;

  const sampleLearnerGroupSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5,
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
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
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
    classroom_url_fragment: 'math',
  };

  const sampleLearnerGroupUserProgDict = {
    username: 'username2',
    progress_sharing_is_turned_on: true,
    stories_progress: [sampleStorySummaryBackendDict],
    subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict],
  };
  const sampleLearnerGroupUserProg =
    LearnerGroupUserProgress.createFromBackendDict(
      sampleLearnerGroupUserProgDict
    );

  const learnerGroupBackendDict = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator_username'],
    learner_usernames: ['username1'],
    invited_learner_usernames: ['username2'],
    subtopic_page_ids: [],
    story_ids: ['story_id_1'],
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupLearnersProgressComponent,
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      providers: [
        {
          provide: NavigationService,
          useClass: MockNavigationService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService
    );
    navigationService = TestBed.inject(NavigationService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);
    fixture = TestBed.createComponent(LearnerGroupLearnersProgressComponent);
    userService = TestBed.inject(UserService);
    component = fixture.componentInstance;

    component.learnerGroup = learnerGroup;
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  });

  it('should initialize', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchLearnersProgressInAssignedSyllabus'
    ).and.returnValue(Promise.resolve([sampleLearnerGroupUserProg]));

    expect(component.learnerGroup).toEqual(learnerGroup);

    component.ngOnInit();
    tick(100);

    expect(component.learnersProgress).toEqual([sampleLearnerGroupUserProg]);
    expect(component.matchingUsersProgress).toEqual([
      sampleLearnerGroupUserProg,
    ]);
  }));

  it('should get count of completed stories by learner correctly', () => {
    component.learnersProgress = [sampleLearnerGroupUserProg];
    component.matchingUsersProgress = [sampleLearnerGroupUserProg];

    expect(component.getCompletedStoriesCountByLearner(0)).toBe(1);
  });

  it('should get count of struggling subtopics of learner correctly', () => {
    component.learnersProgress = [sampleLearnerGroupUserProg];
    component.matchingUsersProgress = [sampleLearnerGroupUserProg];

    expect(component.getStrugglingSubtopicsCountOfLearner(0)).toBe(1);
  });

  it('should manipulate learner specific progress view successfully', () => {
    expect(component.isLearnerSpecificViewActive()).toBeFalse();

    component.activateLearnerSpecificView(sampleLearnerGroupUserProg);
    expect(component.isLearnerSpecificViewActive()).toBeTrue();

    component.disableLearnerSpecificView();
    expect(component.isLearnerSpecificViewActive()).toBeFalse();
  });

  it('should search learner progress with username matching keyword correctly', () => {
    component.learnersProgress = [sampleLearnerGroupUserProg];
    component.matchingUsersProgress = [sampleLearnerGroupUserProg];

    component.searchUsernameQuery = '';
    expect(component.getSearchUsernameResults()).toEqual([
      sampleLearnerGroupUserProg,
    ]);

    component.searchUsernameQuery = 'some';
    expect(component.getSearchUsernameResults()).toEqual([]);

    component.searchUsernameQuery = 'Usern';
    expect(component.getSearchUsernameResults()).toEqual([
      sampleLearnerGroupUserProg,
    ]);
  });

  it('should get user profile image png data url correctly', () => {
    expect(component.getProfileImagePngDataUrl('username')).toBe(
      'default-image-url-png'
    );
  });

  it('should get user profile image webp data url correctly', () => {
    expect(component.getProfileImageWebpDataUrl('username')).toBe(
      'default-image-url-webp'
    );
  });

  it('should open submenu', () => {
    const clickEvent = new KeyboardEvent('click');
    spyOn(navigationService, 'openSubmenu');

    component.openSubmenu(clickEvent, 'learner');

    expect(navigationService.openSubmenu).toHaveBeenCalledWith(
      clickEvent,
      'learner'
    );
  });

  it('should update learner specific progress successfully', fakeAsync(() => {
    const chapterProgressSummaryDict = {
      total_checkpoints_count: 6,
      visited_checkpoints_count: 4,
    };
    const chaptersProgress = ChapterProgressSummary.createFromBackendDict(
      chapterProgressSummaryDict
    );

    spyOn(
      storyViewerBackendApiService,
      'fetchProgressInStoriesChapters'
    ).and.returnValue(Promise.resolve([chaptersProgress]));

    component.updateLearnerSpecificProgress(sampleLearnerGroupUserProg);
    tick(100);

    expect(component.specificLearnerProgress).toEqual(
      sampleLearnerGroupUserProg
    );
    expect(component.storiesChaptersProgress).toEqual([chaptersProgress]);
  }));
});
