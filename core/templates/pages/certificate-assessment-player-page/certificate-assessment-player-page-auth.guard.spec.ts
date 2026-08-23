// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Guard that redirects to 404 when the certificate assessment
 * feature is disabled or the user is not logged in.
 */

import {Location} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {Router, RouterStateSnapshot} from '@angular/router';
import {AppConstants} from 'app.constants';
import {UserInfo} from 'domain/user/user-info.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';
import {CertificateAssessmentPlayerPageAuthGuard} from './certificate-assessment-player-page-auth.guard';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('CertificateAssessmentPlayerPageAuthGuard', () => {
  let guard: CertificateAssessmentPlayerPageAuthGuard;
  let router: Router;
  let location: Location;
  let platformFeatureService: PlatformFeatureService;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
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
      providers: [
        CertificateAssessmentPlayerPageAuthGuard,
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
        {provide: UserService, useValue: userService},
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(CertificateAssessmentPlayerPageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow access when feature flag is enabled and user is logged in', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const canActivateResult = await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should redirect to 404 when the user is not logged in', async () => {
    userService.getUserInfoAsync.and.resolveTo(UserInfo.createDefault());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const canActivateResult = await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-assessment/cert-1'
    );
  });

  it('should redirect to 404 when the user info request fails', async () => {
    userService.getUserInfoAsync.and.rejectWith(new Error('network error'));
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const canActivateResult = await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-assessment/cert-1'
    );
  });

  it('should redirect to 404 when feature flag is disabled', async () => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const canActivateResult = await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-assessment/cert-1'
    );
  });

  it('should not check the user when the feature flag is disabled', async () => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(userService.getUserInfoAsync).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
  });

  it('should still replace the state if redirect navigation fails', async () => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.reject(new Error('navigation failed'))
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    const canActivateResult = await guard.canActivate(
      {} as never,
      {url: '/certificate-assessment/cert-1'} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-assessment/cert-1'
    );
  });
});
