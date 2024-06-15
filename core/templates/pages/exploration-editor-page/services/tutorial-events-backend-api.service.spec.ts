// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StateTutorialFirstTimeBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {TutorialEventsBackendApiService} from 'pages/exploration-editor-page/services/tutorial-events-backend-api.service';

describe('Tutorial events backend service', () => {
  let tutorialEventsBackendApiService: TutorialEventsBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    tutorialEventsBackendApiService = TestBed.inject(
      TutorialEventsBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully call startEditorTutorial', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let expId = 'abc';

    tutorialEventsBackendApiService
      .recordStartedEditorTutorialEventAsync(expId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/started_tutorial_event/' + expId
    );
    expect(req.request.method).toEqual('POST');
    req.flush('Success');

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if startEditorTutorial fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let expId = 'abc';

    tutorialEventsBackendApiService
      .recordStartedEditorTutorialEventAsync(expId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/started_tutorial_event/' + expId
    );
    expect(req.request.method).toEqual('POST');
    req.flush('Error', {
      status: 500,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully call startTranslationTutorial', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let expId = 'abc';

    tutorialEventsBackendApiService
      .recordStartedTranslationTutorialEventAsync(expId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/started_translation_tutorial_event/' + expId
    );
    expect(req.request.method).toEqual('POST');
    req.flush('Success');

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler for startTranslationTutorial', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let expId = 'abc';

    tutorialEventsBackendApiService
      .recordStartedTranslationTutorialEventAsync(expId)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/started_translation_tutorial_event/' + expId
    );
    expect(req.request.method).toEqual('POST');
    req.flush('Error', {
      status: 500,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
