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
 * @fileoverview Unit tests for inviting students to learner group.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { InviteStudentsComponent } from './invite-students.component';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { AlertsService } from 'services/alerts.service';

fdescribe('InviteStudentsComponent', () => {
  let component: InviteStudentsComponent;
  let fixture: ComponentFixture<InviteStudentsComponent>;
  let alertsService: AlertsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;

  const userInfo = {
    username: 'username1',
    user_profile_picture_url: 'profile_picture_url1',
    error: ''
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        InviteStudentsComponent,
        MockTranslatePipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    alertsService = TestBed.inject(AlertsService);
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService);
    fixture = TestBed.createComponent(InviteStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should get RTL language status correctly', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);

    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should search new students to add to the learner group',
    fakeAsync(() => {
      spyOn(learnerGroupBackendApiService, 'searchNewStudentToAddAsync')
        .and.returnValue(Promise.resolve(userInfo));

      component.ngOnInit();

      expect(component.invitedUsersInfo).toEqual([]);
      expect(component.invitedUsernames).toEqual([]);

      component.onSearchQueryChangeExec('username1');
      tick();
      fixture.detectChanges();

      expect(component.invitedUsersInfo).toEqual([userInfo]);
      expect(component.invitedUsernames).toEqual(['username1']);
    })
  );

  it('should show alert message when trying to add an invalid students to ' +
  'the learner group', fakeAsync(() => {
    const userInfo2 = {
      username: 'username2',
      user_profile_picture_url: '',
      error: 'You cannot invite yourself to the learner group.'
    }
    const alertServiceSpy = spyOn(alertsService, 'addInfoMessage')

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
  'student to the learner group', fakeAsync(() => {
    const alertServiceSpy = spyOn(alertsService, 'addInfoMessage')

    component.invitedUsersInfo = [userInfo];
    component.invitedUsernames = ['username1'];

    component.alertTimeout = 2;
    component.onSearchQueryChangeExec('username1');

    tick(100);

    expect(alertServiceSpy).toHaveBeenCalled();
    expect(component.invitedUsersInfo).toEqual([userInfo]);
    expect(component.invitedUsernames).toEqual(['username1']);
  }));

  it('should remove invited student successfully', () => {
    component.invitedUsersInfo = [userInfo];
    component.invitedUsernames = ['username1'];

    component.removeInvitedStudent('username1');

    expect(component.invitedUsersInfo).toEqual([]);
    expect(component.invitedUsernames).toEqual([]);
  });
});