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
 * @fileoverview Tests for EditCertificateOfferingPageAuthGuard.
 */

import {Location} from '@angular/common';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from 'app.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {EditCertificateOfferingPageAuthGuard} from './edit-certificate-offering-page-auth.guard';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('EditCertificateOfferingPageAuthGuard', () => {
  let guard: EditCertificateOfferingPageAuthGuard;
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
        EditCertificateOfferingPageAuthGuard,
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(EditCertificateOfferingPageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow access when certificate assessment is enabled', fakeAsync(() => {
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
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 when certificate assessment is disabled', fakeAsync(() => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    let canActivateResult: boolean | null = null;
    const stateSnapshot = {
      url: '/edit-certificate-assessment-offering/dummy_id',
    } as RouterStateSnapshot;

    guard
      .canActivate(new ActivatedRouteSnapshot(), stateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/edit-certificate-assessment-offering/dummy_id'
    );
  }));

  it('should deny access when redirect to 404 fails', fakeAsync(() => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.reject()
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    let canActivateResult: boolean | null = null;
    const stateSnapshot = {
      url: '/edit-certificate-assessment-offering/dummy_id',
    } as RouterStateSnapshot;

    guard
      .canActivate(new ActivatedRouteSnapshot(), stateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).not.toHaveBeenCalled();
  }));
});
