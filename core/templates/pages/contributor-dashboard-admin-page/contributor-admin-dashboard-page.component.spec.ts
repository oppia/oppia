// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for contributor admin dashboard page component.
 */

import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContributorAdminDashboardPageComponent } from './contributor-admin-dashboard-page.component';
import { UserService } from 'services/user.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommunityContributionStatsDict, ContributorDashboardAdminStatsBackendApiService } from './services/contributor-dashboard-admin-stats-backend-api.service';
import { UserInfo } from 'domain/user/user-info.model';

describe('Contributor dashboard Admin page', () => {
  let component: ContributorAdminDashboardPageComponent;
  let fixture: ComponentFixture<ContributorAdminDashboardPageComponent>;
  let contributorDashboardAdminStatsBackendApiService: (
    ContributorDashboardAdminStatsBackendApiService);
  let userService: UserService;
  let translationCoordinatorInfo = new UserInfo(
    ['USER_ROLE', 'TRANSLATION_COORDINATOR'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );
  let nullUserInfo = new UserInfo(
    ['USER_ROLE', 'TRANSLATION_COORDINATOR'], true, false, false, false, true,
    'en', null, 'tester@example.com', true
  );
  let questionCoordinatorInfo = new UserInfo(
    ['USER_ROLE', 'QUESTION_COORDINATOR'], true, false, false, false, true,
    'en', 'username1', 'tester@example.com', true
  );
  let fullAccessUserInfo = new UserInfo(
    ['USER_ROLE', 'QUESTION_COORDINATOR', 'TRANSLATION_COORDINATOR'], true,
    false, false, false, true, 'en', 'username1', 'tester@example.com', true
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ContributorAdminDashboardPageComponent
      ],
      providers: [
        ContributorDashboardAdminStatsBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ContributorAdminDashboardPageComponent);
    component = fixture.componentInstance;
    contributorDashboardAdminStatsBackendApiService = TestBed.inject(
      ContributorDashboardAdminStatsBackendApiService);
    userService = TestBed.inject(UserService);

    spyOn(
      contributorDashboardAdminStatsBackendApiService, 'fetchCommunityStats')
      .and.returnValue(Promise.resolve({
        translation_reviewers_count: 1,
        question_reviewers_count: 1
      } as CommunityContributionStatsDict));

    component.ngOnInit();
  }));

  it('should evaluate active tab', () => {
    component.setActiveTab('Translation Submitter');
    expect(component.activeTab).toBe('Translation Submitter');
  });

  it('should update selectedContributionType', () => {
    component.updateSelectedContributionType('selection1');
    expect(component.selectedContributionType).toEqual('selection1');
  });

  it('should update translation coordinator view', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(translationCoordinatorInfo));
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(component.isTranslationCoordinator).toBeTrue();
  }));

  it('should update question coordinator view', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(questionCoordinatorInfo));
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(component.isQuestionCoordinator).toBeTrue();
  }));

  it('should update translation and question coordinator view',
    fakeAsync(() => {
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(fullAccessUserInfo));
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      expect(component.isQuestionCoordinator).toBeTrue();
      expect(component.isTranslationCoordinator).toBeTrue();
    }));

  it('should not update translation and question coordinator view' +
    'if username is null', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(nullUserInfo));
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(component.CONTRIBUTION_TYPES).toEqual([]);
  }));
});
