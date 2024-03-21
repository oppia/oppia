// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Diagnostic Test Player page root component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  tick,
  fakeAsync,
} from '@angular/core/testing';

import {PageHeadService} from 'services/page-head.service';
import {AppConstants} from 'app.constants';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {DiagnosticTestPlayerPageRootComponent} from './diagnostic-test-player-page-root.component';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {Router} from '@angular/router';

class MockAccessValidationBackendApiService {
  validateAccessToDiagnosticTestPlayerPage() {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('Diagnostic Test Player Root Page', () => {
  let fixture: ComponentFixture<DiagnosticTestPlayerPageRootComponent>;
  let component: DiagnosticTestPlayerPageRootComponent;
  let pageHeadService: PageHeadService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DiagnosticTestPlayerPageRootComponent, MockTranslatePipe],
      providers: [
        PageHeadService,
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: Router, useClass: MockRouter},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticTestPlayerPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
  });

  it('should successfully instantiate the component', () => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToDiagnosticTestPlayerPage'
    ).and.returnValue(Promise.resolve());

    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToDiagnosticTestPlayerPage'
    ).and.returnValue(Promise.resolve());
    component.ngOnInit();

    expect(
      accessValidationBackendApiService.validateAccessToDiagnosticTestPlayerPage
    ).toHaveBeenCalledWith();
  });

  it('should show error when Diagnostic Test Player does not exist', fakeAsync(() => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToDiagnosticTestPlayerPage'
    ).and.returnValue(Promise.reject());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    expect(component.pageIsShown).toBeFalse();

    component.ngOnInit();
    tick();

    expect(component.pageIsShown).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
  }));
});
