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
 * @fileoverview Tests for new lesson player flag guard
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  NavigationExtras,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {IsNewLessonPlayerGuard} from './lesson-player-flag.guard';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';

class MockPlatformFeatureService {
  get status(): object {
    return {
      NewLessonPlayer: {
        isEnabled: true,
      },
    };
  }
}

class MockRouter {
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('IsNewLessonPlayerGuard', () => {
  let router: Router;
  let guard: IsNewLessonPlayerGuard;
  let platformFeatureService: PlatformFeatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        {
          provide: Router,
          useClass: MockRouter,
        },
      ],
    }).compileComponents();

    guard = TestBed.inject(IsNewLessonPlayerGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
  });

  it('should redirect user to 404 page if flag is disabled', done => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {
        isEnabled: false,
      },
    } as FeatureStatusChecker);
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
        done();
      });
  });

  it('should not redirect user to 404 page if flag is enabled', done => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {
        isEnabled: true,
      },
    } as FeatureStatusChecker);
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeTrue();
        expect(navigateSpy).not.toHaveBeenCalled();
        done();
      });
  });
});
