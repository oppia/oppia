// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CertificateOfferingAvailablePageAuthGuard.
 */

import {Location} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from 'app.constants';
import {UserInfo} from 'domain/user/user-info.model';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';
import {CertificateOfferingAvailablePageAuthGuard} from './certificate-offering-available-page-auth.guard';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('CertificateOfferingAvailablePageAuthGuard', () => {
  let guard: CertificateOfferingAvailablePageAuthGuard;
  let accessValidationBackendApiService: jasmine.SpyObj<AccessValidationBackendApiService>;
  let platformFeatureService: PlatformFeatureService;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;
  let location: Location;

  beforeEach(() => {
    accessValidationBackendApiService = jasmine.createSpyObj(
      'AccessValidationBackendApiService',
      ['validateAccessToClassroomPage']
    );
    accessValidationBackendApiService.validateAccessToClassroomPage.and.resolveTo();
    userService = jasmine.createSpyObj('UserService', ['getUserInfoAsync']);
    userService.getUserInfoAsync.and.resolveTo(
      UserInfo.createFromBackendDict({
        roles: ['USER'],
        is_moderator: false,
        is_curriculum_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: false,
        preferred_site_language_code: 'en',
        username: 'learner',
        email: 'learner@example.com',
        user_is_logged_in: true,
      })
    );
    const platformFeatureServiceSpy = jasmine.createSpyObj(
      'PlatformFeatureService',
      [],
      {
        status: {
          EnableCertificateAssessment: {
            isEnabled: true,
          },
        },
      }
    );

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        CertificateOfferingAvailablePageAuthGuard,
        {
          provide: AccessValidationBackendApiService,
          useValue: accessValidationBackendApiService,
        },
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
        {provide: UserService, useValue: userService},
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(CertificateOfferingAvailablePageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow access when certificate assessment is enabled and the classroom exists', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const route = new ActivatedRouteSnapshot();
    const paramMap = jasmine.createSpyObj('ParamMap', ['get']);
    paramMap.get.and.callFake((key: string) =>
      key === 'classroomUrlFragment' ? 'math' : null
    );
    spyOnProperty(route, 'paramMap', 'get').and.returnValue(paramMap);

    const canActivateResult = await guard.canActivate(
      route,
      {} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeTrue();
    expect(
      accessValidationBackendApiService.validateAccessToClassroomPage
    ).toHaveBeenCalledWith('math');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should redirect to home when the learner is not logged in', async () => {
    userService.getUserInfoAsync.and.resolveTo(UserInfo.createDefault());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const stateSnapshot = {
      url: '/learn/math/certificate-offering-available',
    } as RouterStateSnapshot;

    const canActivateResult = await guard.canActivate(
      new ActivatedRouteSnapshot(),
      stateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(
      accessValidationBackendApiService.validateAccessToClassroomPage
    ).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/learn/math/certificate-offering-available'
    );
  });

  it('should redirect to 404 when certificate assessment is disabled', async () => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const stateSnapshot = {
      url: '/learn/math/certificate-offering-available',
    } as RouterStateSnapshot;

    const canActivateResult = await guard.canActivate(
      new ActivatedRouteSnapshot(),
      stateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(
      accessValidationBackendApiService.validateAccessToClassroomPage
    ).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/learn/math/certificate-offering-available'
    );
  });

  it('should redirect to 404 when the classroom does not exist', async () => {
    accessValidationBackendApiService.validateAccessToClassroomPage.and.rejectWith(
      new Error('classroom not found')
    );
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const route = new ActivatedRouteSnapshot();
    const paramMap = jasmine.createSpyObj('ParamMap', ['get']);
    paramMap.get.and.callFake((key: string) =>
      key === 'classroomUrlFragment' ? 'math' : null
    );
    spyOnProperty(route, 'paramMap', 'get').and.returnValue(paramMap);
    const stateSnapshot = {
      url: '/learn/math/certificate-offering-available',
    } as RouterStateSnapshot;

    const canActivateResult = await guard.canActivate(route, stateSnapshot);

    expect(canActivateResult).toBeFalse();
    expect(
      accessValidationBackendApiService.validateAccessToClassroomPage
    ).toHaveBeenCalledWith('math');
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/learn/math/certificate-offering-available'
    );
  });

  it('should still replace the state if redirect navigation fails', async () => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.reject(new Error('navigation failed'))
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const stateSnapshot = {
      url: '/learn/math/certificate-offering-available',
    } as RouterStateSnapshot;

    const canActivateResult = await guard.canActivate(
      new ActivatedRouteSnapshot(),
      stateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/learn/math/certificate-offering-available'
    );
  });
});
