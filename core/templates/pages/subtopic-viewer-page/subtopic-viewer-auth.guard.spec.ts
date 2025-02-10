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
 * @fileoverview Tests for SubtopicCiewerAuthGuard
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';

import {SubtopicViewerAuthGuard} from './subtopic-viewer-auth.guard';
import {AccessValidationBackendApiService} from '../../pages/oppia-root/routing/access-validation-backend-api.service';
import {UrlService} from '../../services/contextual/url.service';
import {
  ActivatedRouteSnapshot,
  NavigationExtras,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {AppConstants} from '../../app.constants';

class MockRouter {
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('SubtopicViewerAuthGuard', () => {
  let guard: SubtopicViewerAuthGuard;
  let urlService: UrlService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UrlService,
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    }).compileComponents();

    guard = TestBed.inject(SubtopicViewerAuthGuard);
    urlService = TestBed.inject(UrlService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroomUrlFrag'
    );
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topicUrlFrag'
    );
    spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
      'subtopicUrlFrag'
    );
  });

  it('should allow users to access the subtopic viewer page', fakeAsync(done => {
    let avbas = spyOn(
      accessValidationBackendApiService,
      'validateAccessToSubtopicViewerPage'
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
    expect(avbas).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect users to 401 page if they are not allowed to view the subtopic viewer page', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToSubtopicViewerPage'
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
