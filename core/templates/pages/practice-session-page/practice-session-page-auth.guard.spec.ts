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
 * @fileoverview Tests for PracticeSessionAccessGuard
 */
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Location} from '@angular/common';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from '../../app.constants';
import {PracticeSessionAccessGuard} from './practice-session-page-auth.guard';
import {AccessValidationBackendApiService} from '../../pages/oppia-root/routing/access-validation-backend-api.service';

class MockAccessValidationBackendApiService {
  validateAccessToPracticeSessionPage(
    classroomUrlFragment: string,
    topicUrlFragment: string,
    selectedSubtopicIds: string
  ) {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('PracticeSessionAccessGuard', () => {
  let guard: PracticeSessionAccessGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        PracticeSessionAccessGuard,
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(PracticeSessionAccessGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    spyOn(location, 'replaceState');
  });

  it('should allow access if validation succeeds', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToPracticeSessionPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {selected_subtopic_ids: '[1,2,3]'};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
    };

    let canActivateResult: boolean | null = null;

    guard.canActivate(routeSnapshot, {} as RouterStateSnapshot).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalledWith(
      'math',
      'algebra',
      '[1,2,3]'
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 page if validation fails', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToPracticeSessionPage'
    ).and.returnValue(Promise.reject({status: 404}));
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {selected_subtopic_ids: '[1,2,3]'};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
    };

    guard
      .canActivate(
        {
          queryParams: {},
          paramMap: new Map([
            ['classroom_url_fragment', 'math'],
            ['topic_url_fragment', 'algebra'],
            ['selected_subtopic_ids', '[1,2,3]'],
          ]),
        } as unknown as ActivatedRouteSnapshot,
        {
          url: '/practice/session?selected_subtopic_ids=[1,2,3]',
        } as RouterStateSnapshot
      )
      .then(canActivate => {
        expect(canActivate).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });
  }));
});
