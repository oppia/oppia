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
 * @fileoverview Unit tests for inviting learners to learner group.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {InviteLearnersComponent} from './invite-learners.component';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {LearnerGroupUserInfo} from 'domain/learner_group/learner-group-user-info.model';
import {UserService} from 'services/user.service';

describe('InviteLearnersComponent', () => {
  let component: InviteLearnersComponent;
  let fixture: ComponentFixture<InviteLearnersComponent>;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let userService: UserService;

  const userInfo = LearnerGroupUserInfo.createFromBackendDict({
    username: 'username1',
    error: '',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [InviteLearnersComponent, MockTranslatePipe],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService
    );
    fixture = TestBed.createComponent(InviteLearnersComponent);
    userService = TestBed.inject(UserService);
    component = fixture.componentInstance;
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
    fixture.detectChanges();
  });

  it('should search new learners to add to the learner group', fakeAsync(() => {
    spyOn(
      learnerGroupBackendApiService,
      'searchNewLearnerToAddAsync'
    ).and.returnValue(Promise.resolve(userInfo));

    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);

    component.onSearchQueryChangeExec('username1');
    tick();
    fixture.detectChanges();

    expect(component.invitedUsersInfo).toEqual([userInfo]);
    expect(component.invitedUsernames).toEqual(['username1']);
  }));

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

  it(
    'should show error message when trying to add an invalid learners to ' +
      'the learner group',
    fakeAsync(() => {
      const userInfo2 = LearnerGroupUserInfo.createFromBackendDict({
        username: 'username2',
        error: 'You cannot invite yourself to the learner group.',
      });
      spyOn(
        learnerGroupBackendApiService,
        'searchNewLearnerToAddAsync'
      ).and.returnValue(Promise.resolve(userInfo2));

      expect(component.invitedUsersInfo).toEqual([]);
      expect(component.invitedUsernames).toEqual([]);

      component.onSearchQueryChangeExec('username2');

      tick();

      expect(component.invitedUsersInfo).toEqual([]);
      expect(component.invitedUsernames).toEqual([]);
      expect(component.errorMessage).toEqual(
        'You cannot invite yourself to the learner group.'
      );
    })
  );

  it(
    'should show error message when trying to add an already invited ' +
      'learner to the learner group',
    fakeAsync(() => {
      component.invitedUsersInfo = [userInfo];
      component.invitedUsernames = ['username1'];

      component.onSearchQueryChangeExec('username1');

      tick();

      expect(component.invitedUsersInfo).toEqual([userInfo]);
      expect(component.invitedUsernames).toEqual(['username1']);
      expect(component.errorMessage).toEqual(
        'User with username username1 has been already invited.'
      );
    })
  );

  it('should remove invited learner successfully', () => {
    component.invitedUsersInfo = [userInfo];
    component.invitedUsernames = ['username1'];

    component.removeInvitedLearner('username1');

    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);
  });
});
