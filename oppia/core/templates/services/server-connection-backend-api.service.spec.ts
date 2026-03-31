// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that server connection service is working as expected.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {ServerConnectionBackendApiService} from 'services/server-connection-backend-api.service';

describe('Server Connection Backend Api Service', () => {
  let serverConnectionBackendApiService: ServerConnectionBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    serverConnectionBackendApiService = TestBed.inject(
      ServerConnectionBackendApiService
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make get request to the backend', fakeAsync(() => {
    serverConnectionBackendApiService.fetchConnectionCheckResultAsync();
    let req = httpTestingController.expectOne('/internetconnectivityhandler');
    expect(req.request.method).toEqual('GET');
    req.flush({
      isInternetConnected: true,
    });
    flushMicrotasks();
  }));
});
