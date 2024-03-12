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
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {LearnerGroupPreferencesComponent} from './learner-group-preferences.component';
import {LearnerGroupPagesConstants} from '../learner-group-pages.constants';
import {LearnerGroupUserInfo} from 'domain/learner_group/learner-group-user-info.model';
import {LearnerGroupAllLearnersInfo} from 'domain/learner_group/learner-group-all-learners-info.model';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {LoaderService} from 'services/loader.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
    gtag: () => {},
  };
}

describe('LearnerGroupPreferencesComponent', () => {
  let component: LearnerGroupPreferencesComponent;
  let fixture: ComponentFixture<LearnerGroupPreferencesComponent>;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let ngbModal: NgbModal;
  let loaderService: LoaderService;
  let windowRef: MockWindowRef;
  let userService: UserService;

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
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupPreferencesComponent,
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    loaderService = TestBed.inject(LoaderService);
    fixture = TestBed.createComponent(LearnerGroupPreferencesComponent);
    userService = TestBed.inject(UserService);
    component = fixture.componentInstance;

    component.learnerGroup = learnerGroup;
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  });

  it('should set active tab and check if tab is active correctly', () => {
    component.setActiveTab(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS
        .GROUP_DETAILS
    );

    expect(component.activeTab).toEqual(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS
        .GROUP_DETAILS
    );

    let tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS
        .GROUP_DETAILS
    );
    expect(tabIsActive).toBeTrue();

    tabIsActive = component.isTabActive(
      LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS
        .GROUP_LEARNERS
    );
    expect(tabIsActive).toBeFalse();
  });

  it('should update learner group title and description correctly', () => {
    expect(component.newLearnerGroupTitle).toBeUndefined();
    expect(component.newLearnerGroupDescription).toBeUndefined();

    component.updateLearnerGroupTitle('new title');
    component.updateLearnerGroupDesc('new description');

    expect(component.newLearnerGroupTitle).toEqual('new title');
    expect(component.newLearnerGroupDescription).toEqual('new description');
  });

  it('should check status of read only mode correctly', () => {
    expect(component.isReadOnlyModeActive()).toBeTrue();

    component.toggleReadOnlyMode();
    expect(component.isReadOnlyModeActive()).toBeFalse();

    component.toggleReadOnlyMode();
    expect(component.isReadOnlyModeActive()).toBeTrue();
  });

  it('should initialize', fakeAsync(() => {
    const learnerInfo1 = LearnerGroupUserInfo.createFromBackendDict({
      username: 'username1',
      error: '',
    });
    const learnerInfo2 = LearnerGroupUserInfo.createFromBackendDict({
      username: 'username2',
      error: '',
    });
    const learnerInfo3 = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user3',
      error: '',
    });
    const allLearnersInfo = LearnerGroupAllLearnersInfo.createFromBackendDict({
      learners_info: [
        {
          username: 'user3',
          error: '',
        },
      ],
      invited_learners_info: [
        {
          username: 'username1',
          error: '',
        },
        {
          username: 'username2',
          error: '',
        },
      ],
    });
    spyOn(
      learnerGroupBackendApiService,
      'fetchLearnersInfoAsync'
    ).and.returnValue(Promise.resolve(allLearnersInfo));

    expect(component.learnerGroup).toEqual(learnerGroup);

    component.ngOnInit();
    tick();

    expect(component.currentLearnersInfo).toEqual([learnerInfo3]);
    expect(component.invitedLearnersInfo).toEqual([learnerInfo1, learnerInfo2]);
  }));

  it('should save learner group info successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'some title',
      description: 'some description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: ['username1'],
      invited_learner_usernames: ['username2'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.newLearnerGroupTitle = 'title';
    component.newLearnerGroupDescription = 'description';

    component.saveLearnerGroupInfo();
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup.title).toBe('title');
    expect(component.learnerGroup.description).toBe('description');
  }));

  it('should update invited learners to learner group successfully', () => {
    expect(component.invitedLearners).toEqual([]);
    component.updateInvitedLearners(['username1', 'username2']);
    expect(component.invitedLearners).toEqual(['username1', 'username2']);
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

  it('should open invite learners modal successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1', 'username2'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );
    const newLearnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'username1',
      error: '',
    });

    spyOn(ngbModal, 'open').and.returnValues(
      {
        componentInstance: {
          learnerGroupId: 'groupId',
        },
        result: Promise.resolve({
          invitedLearners: ['username1'],
          invitedLearnersInfo: [newLearnerInfo],
        }),
      } as NgbModalRef,
      {
        componentInstance: {
          successMessage: 'message',
          invitedUsernames: ['user1', 'user2'],
        },
        result: Promise.resolve(),
      } as NgbModalRef
    );

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.invitedLearnersInfo = [];

    component.openInviteLearnersModal();
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.invitedLearnersInfo).toEqual([newLearnerInfo]);
  }));

  it('should close invite learners modal successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: ['username1', 'user3'],
      invited_learner_usernames: ['username2'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );
    const learnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user3',
      error: '',
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroupId: 'groupId',
      },
      result: Promise.reject(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(demoLearnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.currentLearnersInfo = [learnerInfo];

    component.openInviteLearnersModal();
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(demoLearnerGroup);
    expect(component.currentLearnersInfo).toEqual([learnerInfo]);
  }));

  it('should close invitation successful modal successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1', 'username2'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );
    const newLearnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'username1',
      error: '',
    });

    spyOn(ngbModal, 'open').and.returnValues(
      {
        componentInstance: {
          learnerGroupId: 'groupId',
        },
        result: Promise.resolve({
          invitedLearners: ['username1'],
          invitedLearnersInfo: [newLearnerInfo],
        }),
      } as NgbModalRef,
      {
        componentInstance: {
          successMessage: 'message',
          invitedUsernames: ['user1', 'user2'],
        },
        result: Promise.reject(),
      } as NgbModalRef
    );

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.invitedLearnersInfo = [];

    component.openInviteLearnersModal();
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.invitedLearnersInfo).toEqual([newLearnerInfo]);
  }));

  it('should open remove learner from group modal successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: ['username1', 'user3'],
      invited_learner_usernames: ['username2'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );
    const learnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user3',
      error: '',
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'Remove Learner',
        confirmationMessage: 'Some confirmation message.',
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.currentLearnersInfo = [learnerInfo];

    component.openRemoveLearnerFromGroupModal(learnerInfo);
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.currentLearnersInfo).toEqual([]);
  }));

  it('should open withdraw learner invitation modal successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: ['username1'],
      invited_learner_usernames: ['username2', 'user3'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );
    const learnerInfo = LearnerGroupUserInfo.createFromBackendDict({
      username: 'user3',
      error: '',
    });

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'Withdraw Invitation',
        confirmationMessage: 'Some confirmation message.',
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.invitedLearnersInfo = [learnerInfo];

    component.openWithdrawLearnerInvitationModal(learnerInfo);
    tick();
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.invitedLearnersInfo).toEqual([]);
  }));

  it('should successfully delete learner group', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        learnerGroupTitle: learnerGroup.title,
      },
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(
      learnerGroupBackendApiService,
      'deleteLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(true));
    spyOn(loaderService, 'showLoadingScreen');

    component.learnerGroup = learnerGroup;

    component.deleteLearnerGroup();
    tick();

    expect(windowRef.nativeWindow.location.href).toBe('/facilitator-dashboard');
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith(
      'Deleting Group'
    );
  }));
});
