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

import {Location} from '@angular/common';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {Router} from '@angular/router';
import {AppConstants} from 'app.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {CertificateAssessmentPlayerPageAuthGuard} from './certificate-assessment-player-page-auth.guard';

describe('CertificateAssessmentPlayerPageAuthGuard', () => {
  let guard: CertificateAssessmentPlayerPageAuthGuard;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;
  let platformFeatureService: PlatformFeatureService;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    location = jasmine.createSpyObj('Location', ['replaceState']);

    TestBed.configureTestingModule({
      providers: [
        CertificateAssessmentPlayerPageAuthGuard,
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: Location,
          useValue: location,
        },
        {
          provide: PlatformFeatureService,
          useValue: {
            status: {
              EnableCertificateAssessment: {
                isEnabled: true,
              },
            },
          },
        },
      ],
    });

    guard = TestBed.inject(CertificateAssessmentPlayerPageAuthGuard);
    platformFeatureService = TestBed.inject(
      PlatformFeatureService
    ) as PlatformFeatureService;
  });

  it('should allow access when feature flag is enabled', fakeAsync(() => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = true;

    let result = false;
    guard
      .canActivate(
        {} as never,
        {url: '/certificate-assessment/cert-1'} as never
      )
      .then(value => {
        result = value;
      });
    tick();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 when feature flag is disabled', fakeAsync(() => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    router.navigate.and.resolveTo(true);

    let result = true;
    guard
      .canActivate(
        {} as never,
        {url: '/certificate-assessment/cert-1'} as never
      )
      .then(value => {
        result = value;
      });
    tick();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(location.replaceState).toHaveBeenCalledWith(
      '/certificate-assessment/cert-1'
    );
  }));
});
