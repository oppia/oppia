// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ExplorationEditsAllowedBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {ExplorationEditsAllowedBackendApiService} from './exploration-edits-allowed-backend-api.service';

describe('Exploration edits allowed backend API service', () => {
  let eeabas: ExplorationEditsAllowedBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    eeabas = TestBed.get(ExplorationEditsAllowedBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully set edits allowed property', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let handlerUrl = '/editsallowedhandler/123';
    eeabas
      .setEditsAllowed(true, '123', () => {})
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(handlerUrl);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body.edits_are_allowed).toBe(true);
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully unset edits allowed property', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let handlerUrl = '/editsallowedhandler/123';
    eeabas
      .setEditsAllowed(false, '123', () => {})
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(handlerUrl);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body.edits_are_allowed).toBe(false);
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
