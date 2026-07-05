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
import {PlatformFeatureService} from 'services/platform-feature.service';
import {CertificateOfferingAvailablePageAuthGuard} from './certificate-offering-available-page-auth.guard';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('CertificateOfferingAvailablePageAuthGuard', () => {
  let guard: CertificateOfferingAvailablePageAuthGuard;
  let platformFeatureService: PlatformFeatureService;
  let router: Router;
  let location: Location;

  beforeEach(() => {
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
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(CertificateOfferingAvailablePageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow access when certificate assessment is enabled', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const canActivateResult = await guard.canActivate(
      new ActivatedRouteSnapshot(),
      {} as RouterStateSnapshot
    );

    expect(canActivateResult).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
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
