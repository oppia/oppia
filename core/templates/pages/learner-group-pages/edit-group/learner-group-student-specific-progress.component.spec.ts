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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NavigationService } from 'services/navigation.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupUserInfo } from 'domain/learner_group/learner-group-user-info.model';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { LearnerGroupStudentSpecificProgressComponent } from './learner-group-student-specific-progress.component';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockNavigationService {
  openSubmenu(evt: KeyboardEvent, menuName: string): void {}
}

fdescribe('LearnerGroupStudentSpecificProgressComponent', () => {
  let component: LearnerGroupStudentSpecificProgressComponent;
  let fixture: ComponentFixture<LearnerGroupStudentSpecificProgressComponent>;

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
    student_usernames: ['username1'],
    invited_student_usernames: ['username2'],
    subtopic_page_ids: [],
    story_ids: ['story_id_1']
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupStudentSpecificProgressComponent,
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
    fixture = TestBed.createComponent
      (LearnerGroupStudentSpecificProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.studentProgress = sampleLearnerGroupUserProg;
  });

  it('should get user profile image data url correctly', () => {
    const dataUrl = '%2Fimages%2Furl%2F1';
    expect(component.getProfileImageDataUrl(dataUrl)).toBe('/images/url/1');
  });
});
