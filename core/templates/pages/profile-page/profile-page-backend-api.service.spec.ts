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
 * @fileoverview Unit tests for ProfilePageBackendApiService.
 */


import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ProfilePageBackendApiService } from
  'pages/profile-page/profile-page-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

describe('Profile test backend API service', () => {
  let profilePageBackendApiService: ProfilePageBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let urlService: UrlService = null;
  let expectedBody = { creator_username: 'testUsername' };

  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfilePageBackendApiService]
    });
    profilePageBackendApiService = TestBed.get(
      ProfilePageBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);

    urlService = TestBed.get(UrlService);
    spyOn(urlService, 'getPathname').and.returnValue( '/profile/testUsername');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully post subscribe to ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.subscribe('testUsername').then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/subscribehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should use the rejection handler if the backend request' +
    'failed on subscribe', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.subscribe('testUsername').then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/subscribehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully post unsubscribe to ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.unsubscribe('testUsername').then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/unsubscribehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should use the rejection handler if the backend request' +
    'failed on unsubscribe', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.unsubscribe('testUsername').then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/unsubscribehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully fetch profile data from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.fetchProfileData().then(
      successHandler, failHandler);

    let req = httpTestingController
      .expectOne('/profilehandler/data/testUsername');
    expect(req.request.method).toEqual('GET');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should use the rejection handler if the backend request' +
    'failed on fetch profile data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    profilePageBackendApiService.fetchProfileData().then(
      successHandler, failHandler);

    let req = httpTestingController
      .expectOne('/profilehandler/data/testUsername');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
