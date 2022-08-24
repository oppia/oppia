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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InviteLearnersComponent } from './invite-learners.component';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { LearnerGroupUserInfo } from
  'domain/learner_group/learner-group-user-info.model';

describe('InviteLearnersComponent', () => {
  let component: InviteLearnersComponent;
  let fixture: ComponentFixture<InviteLearnersComponent>;
  let alertsService: AlertsService;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;

  const userInfo = LearnerGroupUserInfo.createFromBackendDict({
    username: 'username1',
    profile_picture_data_url: 'profile_picture_url1',
    error: ''
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        InviteLearnersComponent,
        MockTranslatePipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService);
    fixture = TestBed.createComponent(InviteLearnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should search new learners to add to the learner group',
    fakeAsync(() => {
      spyOn(learnerGroupBackendApiService, 'searchNewStudentToAddAsync')
        .and.returnValue(Promise.resolve(userInfo));

      expect(component.invitedUsersInfo).toEqual([]);
      expect(component.invitedUsernames).toEqual([]);

      component.onSearchQueryChangeExec('username1');
      tick();
      fixture.detectChanges();

      expect(component.invitedUsersInfo).toEqual([userInfo]);
      expect(component.invitedUsernames).toEqual(['username1']);
    })
  );

  it('should show alert message when trying to add an invalid learners to ' +
  'the learner group', fakeAsync(() => {
    const userInfo2 = LearnerGroupUserInfo.createFromBackendDict({
      username: 'username2',
      profile_picture_data_url: '',
      error: 'You cannot invite yourself to the learner group.'
    });
    const alertServiceSpy = spyOn(alertsService, 'addInfoMessage');

    spyOn(learnerGroupBackendApiService, 'searchNewStudentToAddAsync')
      .and.returnValue(Promise.resolve(userInfo2));

    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);

    component.alertTimeout = 2;
    component.onSearchQueryChangeExec('username2');

    tick(100);

    expect(alertServiceSpy).toHaveBeenCalled();
    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);
  }));

  it('should show alert message when trying to add an already invited ' +
  'learner to the learner group', fakeAsync(() => {
    const alertServiceSpy = spyOn(alertsService, 'addInfoMessage');

    component.invitedUsersInfo = [userInfo];
    component.invitedUsernames = ['username1'];

    component.alertTimeout = 2;
    component.onSearchQueryChangeExec('username1');

    tick(100);

    expect(alertServiceSpy).toHaveBeenCalled();
    expect(component.invitedUsersInfo).toEqual([userInfo]);
    expect(component.invitedUsernames).toEqual(['username1']);
  }));

  it('should remove invited learner successfully', () => {
    component.invitedUsersInfo = [userInfo];
    component.invitedUsernames = ['username1'];

    component.removeInvitedLearner('username1');

    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);
  });
});
