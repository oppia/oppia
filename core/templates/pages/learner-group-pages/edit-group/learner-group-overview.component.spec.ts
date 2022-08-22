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
 * @fileoverview Unit tests for learner group overview component.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { TranslateService } from '@ngx-translate/core';
import { LearnerGroupOverviewComponent } from
  './learner-group-overview.component';
import { LearnerGroupSyllabusBackendApiService } from
  'domain/learner_group/learner-group-syllabus-backend-api.service';
import { LearnerGroupUserProgress } from
  'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-info.model';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('LearnerGroupOverviewComponent', () => {
  let component: LearnerGroupOverviewComponent;
  let fixture: ComponentFixture<LearnerGroupOverviewComponent>;
  let learnerGroupSyllabusBackendApiService:
    LearnerGroupSyllabusBackendApiService;

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
    thumbnail_bg_color: '#a33f40'
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

  const userInfo = LearnerGroupUserInfo.createFromBackendDict({
    username: 'username2',
    profile_picture_data_url: 'picture',
    error: ''
  });
  const sampleLearnerGroupUserProgDict = {
    username: 'username2',
    progress_sharing_is_turned_on: true,
    profile_picture_data_url: 'picture',
    stories_progress: [sampleStorySummaryBackendDict],
    subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict]
  };
  const sampleLearnerGroupUserProg = (
    LearnerGroupUserProgress.createFromBackendDict(
      sampleLearnerGroupUserProgDict)
  );

  const learnerGroupBackendDict = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator_username'],
    student_usernames: ['username2'],
    invited_student_usernames: ['username1'],
    subtopic_page_ids: ['topicId1:1'],
    story_ids: ['sample_story_id']
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupOverviewComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService);
    fixture = TestBed.createComponent(LearnerGroupOverviewComponent);
    component = fixture.componentInstance;

    component.learnerGroup = learnerGroup;
  });

  it('should initialize', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchStudentsProgressInAssignedSyllabus'
    ).and.returnValue(Promise.resolve([sampleLearnerGroupUserProg]));
    expect(component.activeTab).toBeUndefined();
    expect(component.studentsProgress).toBeUndefined();

    component.ngOnInit();
    tick();

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .SKILLS_ANALYSIS);
    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.studentsProgress).toEqual([sampleLearnerGroupUserProg]);
  }));

  it('should check whether the given tab is active successfully', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .SKILLS_ANALYSIS);

    let tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .SKILLS_ANALYSIS);
    expect(tabIsActive).toBeTrue();

    tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS
        .PROGRESS_IN_STORIES);
    expect(tabIsActive).toBeFalse();
  });

  it('should set active tab correctly', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.STUDENTS_PROGRESS);

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS.STUDENTS_PROGRESS);
  });

  it('should get story completions info correctly', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchStudentsProgressInAssignedSyllabus'
    ).and.returnValue(Promise.resolve([sampleLearnerGroupUserProg]));

    component.learnerGroup = learnerGroup;

    component.ngOnInit();
    tick();

    expect(component.studentsProgress).toEqual([sampleLearnerGroupUserProg]);

    const storyCompletionsInfo = component.getStoryCompletionsInfo(
      'sample_story_id');
    expect(storyCompletionsInfo).toEqual([userInfo]);
  }));

  it('should get info of students struggling with subtopics correctly',
    fakeAsync(() => {
      spyOn(
        learnerGroupSyllabusBackendApiService,
        'fetchStudentsProgressInAssignedSyllabus'
      ).and.returnValue(Promise.resolve([sampleLearnerGroupUserProg]));

      component.learnerGroup = learnerGroup;

      component.ngOnInit();
      tick(100);

      expect(component.studentsProgress).toEqual([sampleLearnerGroupUserProg]);

      const strugglingStudentsInfo = (
        component.getStrugglingStudentsInfoInSubtopics('topicId1:1'));
      expect(strugglingStudentsInfo).toEqual([userInfo]);
    })
  );

  it('should get user profile image data url correctly', () => {
    const dataUrl = '%2Fimages%2Furl%2F1';
    expect(component.getProfileImageDataUrl(dataUrl)).toBe('/images/url/1');
  });
});
