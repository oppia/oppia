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
 * @fileoverview Unit tests for Http Service.
 */

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpService } from 'services/http.service';
import { HttpTestingController, HttpClientTestingModule } from
  '@angular/common/http/testing';

fdescribe('HTML service', () => {
  let httpTestingController: HttpTestingController;
  let service: HttpService;
  const ARBITRARY_TEST_URL = 'abcdfg.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HttpService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make an HTTP GET request', fakeAsync(async() => {
    const promise = service.get(ARBITRARY_TEST_URL);
    const req = httpTestingController.expectOne(ARBITRARY_TEST_URL);
    expect(req.request.method).toEqual('GET');
    req.flush('response');
    flushMicrotasks();
    expect(await promise).toEqual('response');
  }));

  it('should make a HTTP PUT request', fakeAsync(async() => {
    const promise = service.put(ARBITRARY_TEST_URL);
    const req = httpTestingController.expectOne(ARBITRARY_TEST_URL);
    expect(req.request.method).toEqual('PUT');
    req.flush('response');
    flushMicrotasks();
    expect(await promise).toEqual('response');
  }));

  it('should make a HTTP PATCH request', fakeAsync(async() => {
    const promise = service.patch(ARBITRARY_TEST_URL);
    const req = httpTestingController.expectOne(ARBITRARY_TEST_URL);
    expect(req.request.method).toEqual('PATCH');
    req.flush('response');
    flushMicrotasks();
    expect(await promise).toEqual('response');
  }));

  it('should make a HTTP DELETE request', fakeAsync(async() => {
    // eslint-disable-next-line dot-notation
    const promise = service.delete(ARBITRARY_TEST_URL);
    const req = httpTestingController.expectOne(ARBITRARY_TEST_URL);
    expect(req.request.method).toEqual('DELETE');
    req.flush('response');
    flushMicrotasks();
    expect(await promise).toEqual('response');
  }));

  it('should make a HTTP POST request', fakeAsync(async() => {
    const promise = service.post(ARBITRARY_TEST_URL);
    const req = httpTestingController.expectOne(ARBITRARY_TEST_URL);
    expect(req.request.method).toEqual('POST');
    req.flush('response');
    flushMicrotasks();
    expect(await promise).toEqual('response');
  }));
});
