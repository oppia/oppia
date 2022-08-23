// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the email dashboard page.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { EmailDashboardQuery } from 'domain/email-dashboard/email-dashboard-query.model';
import { UserInfo } from 'domain/user/user-info.model';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { EmailDashboardDataService } from './email-dashboard-data.service';
import { EmailDashboardPageComponent } from './email-dashboard-page.component';

describe('Email Dashboard Page Component', () => {
  let fixture: ComponentFixture<EmailDashboardPageComponent>;
  let componentInstance: EmailDashboardPageComponent;
  let loaderService: LoaderService;
  let userService: UserService;
  let emailDashboardDataService: EmailDashboardDataService;

  class MockChangeDetectorRef {
    detectChanges(): void {}
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        EmailDashboardPageComponent
      ],
      providers: [
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        },
        EmailDashboardDataService,
        LoaderService,
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailDashboardPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService);
    userService = TestBed.inject(UserService);
    emailDashboardDataService = TestBed.inject(EmailDashboardDataService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', fakeAsync(() => {
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(componentInstance, 'resetForm');

    let username = 'user';
    let userInfo = new UserInfo(
      [], true, true, true, true, true, '', username, '', true);
    let queries: EmailDashboardQuery[] = [];

    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(userInfo));
    spyOn(emailDashboardDataService, 'getNextQueriesAsync').and.returnValue(
      Promise.resolve(queries));
    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.username).toEqual(username);
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(componentInstance.currentPageOfQueries).toEqual(queries);
  }));

  it('should update query data', () => {
    let field = 'f1';
    componentInstance.data = {};
    componentInstance.data[field] = 2;
    componentInstance.updateQueryData(3, field);
  });

  it('should reset form', () => {
    let expectedData: Record<string, boolean | null> = {};
    AppConstants.EMAIL_DASHBOARD_PREDICATE_DEFINITION.forEach(predicate => {
      expectedData[predicate.backend_attr] = predicate.default_value;
    });
    componentInstance.resetForm();
    expect(componentInstance.data).toEqual(expectedData);
  });

  it('should tell are inputs empty', () => {
    componentInstance.data = {};
    expect(componentInstance.areAllInputsEmpty()).toBeTrue();
  });

  it('should submit query', fakeAsync(() => {
    let queries: EmailDashboardQuery[] = [];
    spyOn(emailDashboardDataService, 'submitQueryAsync').and.returnValue(
      Promise.resolve(queries));
    spyOn(componentInstance, 'resetForm');
    componentInstance.submitQueryAsync();
    tick();
    expect(componentInstance.currentPageOfQueries).toEqual(queries);
    expect(componentInstance.showSuccessMessage).toBeTrue();
  }));

  it('should get next page of queries', fakeAsync(() => {
    let queries: EmailDashboardQuery[] = [];
    spyOn(emailDashboardDataService, 'isNextPageAvailable').and.returnValue(
      true);
    spyOn(emailDashboardDataService, 'getNextQueriesAsync').and.returnValue(
      Promise.resolve(queries));
    componentInstance.getNextPageOfQueries();
    tick();
    expect(componentInstance.currentPageOfQueries).toEqual(queries);
  }));

  it('should get previous page of queries', () => {
    spyOn(emailDashboardDataService, 'isPreviousPageAvailable').and.returnValue(
      true);
    spyOn(emailDashboardDataService, 'getPreviousQueries').and.returnValue([]);
    componentInstance.getPreviousPageOfQueries();
    expect(emailDashboardDataService.isPreviousPageAvailable)
      .toHaveBeenCalled();
    expect(componentInstance.currentPageOfQueries).toEqual([]);
  });

  it('should show next button', () => {
    let nextPageIsAvailable = true;
    spyOn(emailDashboardDataService, 'isNextPageAvailable').and.returnValue(
      nextPageIsAvailable);
    expect(componentInstance.showNextButton()).toEqual(nextPageIsAvailable);
  });

  it('should show previous button', () => {
    let previousPageIsAvailable = true;
    spyOn(emailDashboardDataService, 'isPreviousPageAvailable').and.returnValue(
      previousPageIsAvailable);
    expect(componentInstance.showPreviousButton()).toEqual(
      previousPageIsAvailable);
  });

  it('should recheck status', fakeAsync(() => {
    let query = new EmailDashboardQuery('', '', 0, '', '');
    componentInstance.currentPageOfQueries = [query];
    spyOn(emailDashboardDataService, 'fetchQueryAsync').and.returnValue(
      Promise.resolve(query));
    componentInstance.recheckStatus(0);
    tick();
    expect(componentInstance.currentPageOfQueries[0]).toEqual(query);
  }));

  it('should link to result page', () => {
    let submitter = 'submitter1';
    componentInstance.username = submitter;
    expect(componentInstance.showLinkToResultPage(
      submitter, 'completed')).toBeTrue();
  });
});
