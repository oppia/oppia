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
 * @fileoverview Unit tests for StateTutorialEventRegistryBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { StateTutorialEventRegistryBackendApiService } from
'./state-tutorial-event-registry-backend-api.service';

describe('State tutorial first time backend api service', () => {
  let backendApiService: StateTutorialEventRegistryBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StateTutorialEventRegistryBackendApiService]
    });

    backendApiService = TestBed.get(
      StateTutorialEventRegistryBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(
    'should successfully register tutorial start event in backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      backendApiService.recordEditorTutorialStartEvent('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/started_tutorial_event/0');
      expect(req.request.method).toEqual('POST');
      req.flush({});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should use rejection handler if tutorial start event registration fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      backendApiService.recordEditorTutorialStartEvent('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/started_tutorial_event/0');
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Error loading data.',
      }, {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it(
    'should successfully register translation tutorial start event in backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      backendApiService.recordTranslationsTutorialStartEvent('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/started_translation_tutorial_event/0');
      expect(req.request.method).toEqual('POST');
      req.flush({});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should use rejection handler if translation tutorial' +
    'start event registration fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      backendApiService.recordTranslationsTutorialStartEvent('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/started_translation_tutorial_event/0');
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Error loading data.',
        }, {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
