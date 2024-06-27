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
 * @fileoverview Tests for ClassroomsPageAuthGuard
 */
import {Location} from '@angular/common';
import {AppConstants} from 'app.constants';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {ClassroomsPageAuthGuard} from './classrooms-page-auth.guard';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';

class MockAccessValidationBackendApiService {
  validateAccessToClassroomsPage() {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('ClassroomsPageAuthGuard', () => {
  let guard: ClassroomsPageAuthGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ClassroomsPageAuthGuard,
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(ClassroomsPageAuthGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
  });

  it('should allow access if validation succeeds', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToClassroomsPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    let canActivateResult: boolean | null = null;

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(
      accessValidationBackendApiService.validateAccessToClassroomsPage
    ).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 page if validation fails', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToClassroomsPage'
    ).and.returnValue(Promise.reject());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    let canActivateResult: boolean | null = null;

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
  }));
});
