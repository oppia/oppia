// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the pending account deletion root component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { PageHeadService } from 'services/page-head.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { PendingAccountDeletionPageRootComponent } from './pending-account-deletion-page-root.component';

describe('Pending Account Deletion Page Root', () => {
  let fixture: ComponentFixture<PendingAccountDeletionPageRootComponent>;
  let component: PendingAccountDeletionPageRootComponent;
  let pageHeadService: PageHeadService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let loaderService: LoaderService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        PendingAccountDeletionPageRootComponent,
        MockTranslatePipe
      ],
      providers: [
        PageHeadService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingAccountDeletionPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    loaderService = TestBed.inject(LoaderService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService);
  });

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should initialize and show page when access is valid', fakeAsync(() => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(accessValidationBackendApiService, 'accountDeletionIsEnabled')
      .and.returnValue(Promise.resolve({
        valid: true
      }));
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    component.ngOnInit();
    tick();
    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalled();
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      accessValidationBackendApiService.accountDeletionIsEnabled)
      .toHaveBeenCalled();
    expect(component.pageIsShown).toBeTrue();
    expect(component.errorPageIsShown).toBeFalse();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should initialize and show error page when access is not valid',
    fakeAsync(() => {
      spyOn(pageHeadService, 'updateTitleAndMetaTags');
      spyOn(
        accessValidationBackendApiService,
        'accountDeletionIsEnabled')
        .and.returnValue(Promise.resolve({
          valid: false
        }));
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      component.ngOnInit();
      tick();
      expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalled();
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(accessValidationBackendApiService.accountDeletionIsEnabled)
        .toHaveBeenCalled();
      expect(component.pageIsShown).toBeFalse();
      expect(component.errorPageIsShown).toBeTrue();
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

  it('should initialize and show error page when server respond with error',
    fakeAsync(() => {
      spyOn(pageHeadService, 'updateTitleAndMetaTags');
      spyOn(accessValidationBackendApiService, 'accountDeletionIsEnabled')
        .and.returnValue(Promise.reject());
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      component.ngOnInit();
      tick();
      expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalled();
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(accessValidationBackendApiService.accountDeletionIsEnabled)
        .toHaveBeenCalled();
      expect(component.pageIsShown).toBeFalse();
      expect(component.errorPageIsShown).toBeTrue();
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));
});
