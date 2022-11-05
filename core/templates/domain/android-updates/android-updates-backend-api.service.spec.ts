// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for android updates backend API service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AndroidUpdatesBackendApiService } from './android-updates-backend-api.service';

describe('Android updates backend api service', () => {
  let aubas: AndroidUpdatesBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    aubas = TestBed.inject(AndroidUpdatesBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      aubas.subscribeUserToAndroidList('email@example.com', 'name').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/androidlistsubscriptionhandler');
      expect(req.request.method).toEqual('PUT');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  it('should subscribe user to android list' +
  'when calling subscribeUserToAndroidList', fakeAsync(() => {
    let email = 'email@example.com';
    let name = 'username';
    let payload = {
      email: email,
      name: name,
    };
    aubas.subscribeUserToAndroidList(email, name)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/androidlistsubscriptionhandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));
});
