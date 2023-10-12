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
 * @fileoverview Unit tests for the classroom page root component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync, tick, fakeAsync } from '@angular/core/testing';

import { PageHeadService } from 'services/page-head.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ClassroomPageRootComponent } from './classroom-page-root.component';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

describe('Classroom Root Page', () => {
  let fixture: ComponentFixture<ClassroomPageRootComponent>;
  let component: ClassroomPageRootComponent;
  let pageHeadService: PageHeadService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let urlService: UrlService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ClassroomPageRootComponent,
        MockTranslatePipe
      ],
      providers: [
        PageHeadService,
        UrlService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService);
    urlService = TestBed.inject(UrlService);
  });

  it('should successfully instantiate the component',
    () => {
      spyOn(accessValidationBackendApiService, 'validateAccessToClassroomPage')
        .and.returnValue(Promise.resolve());
      expect(component).toBeDefined();
    });

  it('should initialize', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(accessValidationBackendApiService, 'validateAccessToClassroomPage')
      .and.returnValue(Promise.resolve());
    component.ngOnInit();

    expect(
      accessValidationBackendApiService.validateAccessToClassroomPage)
      .toHaveBeenCalledWith('classroom_url_fragment');
  });

  it('should show error when classroom does not exist', fakeAsync(() => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(urlService, 'getClassroomUrlFragmentFromUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(accessValidationBackendApiService, 'validateAccessToClassroomPage')
      .and.returnValue(Promise.reject());

    expect(component.errorPageIsShown).toBeFalse();
    expect(component.pageIsShown).toBeFalse();

    component.ngOnInit();
    tick();

    expect(component.pageIsShown).toBeFalse();
    expect(component.errorPageIsShown).toBeTrue();
  }));
});
