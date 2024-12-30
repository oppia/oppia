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
 * @fileoverview Tests for SkillEditorPageAccess
 */
import {Location} from '@angular/common';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from 'app.constants';
import {SkillEditorAccessGuard} from './skill-editor-access.guard';
import {AccessValidationBackendApiService} from '../oppia-root/routing/access-validation-backend-api.service';

class MockAccessValidationBackendApiService {
  validateAccessToSkillEditorPage(skillId: string) {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('SkillEditorPageAccess', () => {
  let guard: SkillEditorAccessGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        SkillEditorAccessGuard,
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(SkillEditorAccessGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
  });

  it('should allow access if validation succeeds', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToSkillEditorPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    let resultCanBeActivated = guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(result => (resultCanBeActivated = result));

    tick();

    expect(resultCanBeActivated).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 401 page if validation fails', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToSkillEditorPage'
    ).and.returnValue(Promise.reject());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    let resultCanBeActivated = guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(result => (resultCanBeActivated = result));

    tick();

    expect(resultCanBeActivated).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
    ]);
  }));
});
