// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

describe('HTML escaper service', () => {
  let httpTestingController: HttpTestingController;
  let service: HttpService;
  const arbitraryTestUrl = 'abcdfg.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpService],
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    service = TestBed.get(HttpService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should make an HTTP GET request', fakeAsync(async() => {
    const getPromise = service.get(arbitraryTestUrl);
    const expectedReq = httpTestingController.expectOne(arbitraryTestUrl);
    expect(expectedReq.request.method).toEqual('GET');
    expectedReq.flush('response');
    flushMicrotasks();
    expect(await getPromise).toEqual('response');
  }));

  it('should make a HTTP PUT request', fakeAsync(async() => {
    const getPromise = service.put(arbitraryTestUrl);
    const expectedReq = httpTestingController.expectOne(arbitraryTestUrl);
    expect(expectedReq.request.method).toEqual('PUT');
    expectedReq.flush('response');
    flushMicrotasks();
    expect(await getPromise).toEqual('response');
  }));

  it('should make a HTTP PATCH request', fakeAsync(async() => {
    const getPromise = service.patch(arbitraryTestUrl);
    const expectedReq = httpTestingController.expectOne(arbitraryTestUrl);
    expect(expectedReq.request.method).toEqual('PATCH');
    expectedReq.flush('response');
    flushMicrotasks();
    expect(await getPromise).toEqual('response');
  }));

  it('should make a HTTP DELETE request', fakeAsync(async() => {
    /* eslint-disable-next-line dot-notation */
    const getPromise = service.delete(arbitraryTestUrl);
    const expectedReq = httpTestingController.expectOne(arbitraryTestUrl);
    expect(expectedReq.request.method).toEqual('DELETE');
    expectedReq.flush('response');
    flushMicrotasks();
    expect(await getPromise).toEqual('response');
  }));

  it('should make a HTTP POST request', fakeAsync(async() => {
    const getPromise = service.post(arbitraryTestUrl);
    const expectedReq = httpTestingController.expectOne(arbitraryTestUrl);
    expect(expectedReq.request.method).toEqual('POST');
    expectedReq.flush('response');
    flushMicrotasks();
    expect(await getPromise).toEqual('response');
  }));
});
