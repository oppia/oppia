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
 * @fileoverview Tests that the user service is working as expected.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';

import {AuthBackendApiService} from 'services/auth-backend-api.service';

describe('Auth Backend Api Service', () => {
  let authBackendApiService: AuthBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [HttpClientTestingModule]});
    httpTestingController = TestBed.inject(HttpTestingController);
    authBackendApiService = TestBed.inject(AuthBackendApiService);
  });

  afterEach(() => httpTestingController.verify());

  it('should call /session_begin', fakeAsync(async () => {
    const response = authBackendApiService.beginSessionAsync('TKN');
    flushMicrotasks();

    const ping = httpTestingController.expectOne('/session_begin');
    expect(ping.request.method).toEqual('GET');
    expect(ping.request.headers.get('Authorization')).toEqual('Bearer TKN');
    ping.flush({});
    flushMicrotasks();

    await expectAsync(response).toBeResolved();
  }));

  it('should call /session_end', fakeAsync(async () => {
    const response = authBackendApiService.endSessionAsync();
    flushMicrotasks();

    const ping = httpTestingController.expectOne('/session_end');
    expect(ping.request.method).toEqual('GET');
    ping.flush({});
    flushMicrotasks();

    await expectAsync(response).toBeResolved();
  }));
});
