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
 * @fileoverview Unit tests for view learner group page.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { TranslateService } from '@ngx-translate/core';
import { ViewLearnerGroupPageComponent } from './view-learner-group-page.component';
import { ContextService } from 'services/context.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
    gtag: () => {}
  };
}

describe('ViewLearnerGroupPageComponent', () => {
  let component: ViewLearnerGroupPageComponent;
  let fixture: ComponentFixture<ViewLearnerGroupPageComponent>;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let contextService: ContextService;
  let ngbModal: NgbModal;
  let loaderService: LoaderService;
  let windowRef: MockWindowRef;
  let userService: UserService;
  let learnerGroupSyllabusBackendApiService:
    LearnerGroupSyllabusBackendApiService;

  const sampleLearnerGroupSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.95
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
    all_node_dicts: [],
    topic_name: 'Topic one',
    topic_url_fragment: 'topic-one',
    classroom_url_fragment: 'math'
  };

  const sampleLearnerGroupUserProgDict = {
    username: 'username2',
    progress_sharing_is_turned_on: true,
    stories_progress: [sampleStorySummaryBackendDict],
    subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict]
  };
  const sampleLearnerGroupUserProg = (
    LearnerGroupUserProgress.createFromBackendDict(
      sampleLearnerGroupUserProgDict)
  );

  const learnerGroup = new LearnerGroupData(
    'groupId', 'title', 'description', ['facilitator_username'],
    ['username2'], ['username1'], ['subtopic_page_id'], []
  );

  const userInfo = new UserInfo(
    ['USER_ROLE'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ViewLearnerGroupPageComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService);
    contextService = TestBed.inject(ContextService);
    ngbModal = TestBed.inject(NgbModal);
    loaderService = TestBed.inject(LoaderService);
    userService = TestBed.inject(UserService);
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService);
    fixture = TestBed.createComponent(ViewLearnerGroupPageComponent);
    component = fixture.componentInstance;

    spyOn(contextService, 'getLearnerGroupId').and.returnValue('groupId');

    fixture.detectChanges();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(learnerGroupBackendApiService, 'fetchLearnerGroupInfoAsync')
      .and.returnValue(Promise.resolve(learnerGroup));
    spyOn(
      learnerGroupBackendApiService,
      'fetchProgressSharingPermissionOfLearnerAsync'
    ).and.returnValue(Promise.resolve(true));
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchLearnerSpecificProgressInAssignedSyllabus'
    ).and.returnValue(Promise.resolve(sampleLearnerGroupUserProg));
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));

    component.ngOnInit();
    tick();

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS.OVERVIEW);
    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.getLearnersCount()).toBe(1);
    expect(component.username).toBe('username1');
    expect(component.progressSharingPermission).toBe(true);
  }));

  it('should set active tab and check if tab is active correctly', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS.ASSIGNED_SYLLABUS);

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS.ASSIGNED_SYLLABUS);

    let tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS.ASSIGNED_SYLLABUS);
    expect(tabIsActive).toBeTrue();

    tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS.OVERVIEW);
    expect(tabIsActive).toBeFalse();
  });

  it('should get count of completed stories by learner correctly', () => {
    component.learnerProgress = sampleLearnerGroupUserProg;
    expect(component.getCompletedStoriesCountByLearner()).toBe(1);
  });

  it('should get count of mastered subtopics by learner correctly', () => {
    component.learnerProgress = sampleLearnerGroupUserProg;
    expect(component.getMasteredSubtopicsCountOfLearner()).toBe(1);
  });

  it('should successfully exit learner group', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroupTitle: learnerGroup.title,
      },
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(learnerGroupBackendApiService, 'exitLearnerGroupAsync')
      .and.returnValue(Promise.resolve(learnerGroup));
    spyOn(loaderService, 'showLoadingScreen');

    component.learnerGroup = learnerGroup;
    component.username = 'username1';

    component.exitLearnerGroup();
    tick();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learner-dashboard?active_tab=learner-groups');
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith(
      'Exiting Group');
  }));

  it('should correctly view and update learner group preferences',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          learnerGroup: learnerGroup,
          progressSharingPermission: true
        },
        result: Promise.resolve({
          progressSharingPermission: false
        })
      } as NgbModalRef);
      spyOn(
        learnerGroupBackendApiService,
        'updateProgressSharingPermissionAsync'
      ).and.returnValue(Promise.resolve(false));

      component.learnerGroup = learnerGroup;
      component.progressSharingPermission = true;

      component.viewLearnerGroupPreferences();
      tick();

      expect(component.progressSharingPermission).toBe(false);
    })
  );
});
