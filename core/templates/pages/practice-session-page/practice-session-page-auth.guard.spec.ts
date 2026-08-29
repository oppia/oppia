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
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockAccessValidationBackendApiService {
  validateAccessToPracticeSessionPage(
    _classroomUrlFragment: string,
    _topicUrlFragment: string,
    _selectedSubtopicIds: string
  ) {
    return Promise.resolve();
  }

  validateAccessToLessonPracticePage(
    _classroomUrlFragment: string,
    _topicUrlFragment: string,
    _nodeId: string
  ) {
    return Promise.resolve();
  }

  validateAccessToEndOfArcPage(
    _classroomUrlFragment: string,
    _topicUrlFragment: string,
    _arcId: string
  ) {
    return Promise.resolve();
  }

  validateAccessToMasteryChallengePage(
    _classroomUrlFragment: string,
    _topicUrlFragment: string
  ) {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockPlatformFeatureService {
  status = {
    StoryEditorArcs: {
      isEnabled: true,
    },
  };
}

describe('PracticeSessionAccessGuard', () => {
  let guard: PracticeSessionAccessGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;
  let location: Location;
  let mockPlatformFeatureService: MockPlatformFeatureService;

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
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
        Location,
      ],
    });

    guard = TestBed.inject(PracticeSessionAccessGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    mockPlatformFeatureService = TestBed.inject(
      PlatformFeatureService
    ) as unknown as MockPlatformFeatureService;

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

    Object.defineProperty(routeSnapshot, 'params', {
      get: () => ({
        classroom_url_fragment: 'math',
        topic_url_fragment: 'algebra',
      }),
    });

    Object.defineProperty(routeSnapshot, 'queryParams', {
      get: () => ({
        selected_subtopic_ids: '[1,2,3]',
      }),
    });

    guard
      .canActivate(routeSnapshot, {
        url: '/practice/session?selected_subtopic_ids=[1,2,3]',
      } as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeFalsy();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });

    tick();
  }));

  it('should prioritize selected_subtopic_ids over node_id session', fakeAsync(() => {
    const validatePracticeAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToPracticeSessionPage'
    ).and.returnValue(Promise.resolve());
    const validateLessonAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToLessonPracticePage'
    ).and.returnValue(Promise.resolve());

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {selected_subtopic_ids: '[1]'};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
      node_id: 'session',
    };

    let canActivateResult: boolean | null = null;

    guard.canActivate(routeSnapshot, {} as RouterStateSnapshot).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validatePracticeAccessSpy).toHaveBeenCalledWith(
      'math',
      'algebra',
      '[1]'
    );
    expect(validateLessonAccessSpy).not.toHaveBeenCalled();
  }));

  it('should allow access for lesson practice when node_id is present', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToLessonPracticePage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
      node_id: '1',
    };

    let canActivateResult: boolean | null = null;

    guard.canActivate(routeSnapshot, {} as RouterStateSnapshot).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalledWith('math', 'algebra', '1');
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should allow access for end-of-arc when arc_id is present', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToEndOfArcPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
      arc_id: '1',
    };

    let canActivateResult: boolean | null = null;

    guard.canActivate(routeSnapshot, {} as RouterStateSnapshot).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalledWith('math', 'algebra', '1');
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should allow access for mastery challenge when no params are present', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToMasteryChallengePage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
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
    expect(validateAccessSpy).toHaveBeenCalledWith('math', 'algebra');
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 when StoryEditorArcs flag is disabled and node_id is present', fakeAsync(() => {
    mockPlatformFeatureService.status.StoryEditorArcs.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
      node_id: '1',
    };

    guard
      .canActivate(routeSnapshot, {
        url: '/learn/math/algebra/practice/1',
      } as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeFalsy();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });

    tick();
  }));

  it('should redirect to 404 when StoryEditorArcs flag is disabled and arc_id is present', fakeAsync(() => {
    mockPlatformFeatureService.status.StoryEditorArcs.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
      arc_id: '1',
    };

    guard
      .canActivate(routeSnapshot, {
        url: '/learn/math/algebra/test/arc/1',
      } as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeFalsy();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });

    tick();
  }));

  it('should redirect to 404 when StoryEditorArcs flag is disabled and no params present (mastery)', fakeAsync(() => {
    mockPlatformFeatureService.status.StoryEditorArcs.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.queryParams = {};
    (routeSnapshot.params as {[key: string]: string}) = {
      classroom_url_fragment: 'math',
      topic_url_fragment: 'algebra',
    };

    guard
      .canActivate(routeSnapshot, {
        url: '/learn/math/algebra/mastery-challenge',
      } as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBeFalsy();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
      });

    tick();
  }));
});
