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
 * @fileoverview Unit tests for RequestInterceptorService.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import {HTTP_INTERCEPTORS, HttpClient} from '@angular/common/http';

import {
  MockCsrfTokenService,
  RequestInterceptor
} from 'services/request-interceptor.service';

describe('Request Interceptor Service', () => {
  let mcts: MockCsrfTokenService = null;
  let httpClient: HttpClient = null;
  let httpTestingController: HttpTestingController = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: RequestInterceptor,
        multi: true
      }]
    });

    mcts = TestBed.get(MockCsrfTokenService);
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    // This throws "Argument of type 'string[]' is not assignable to parameter
    // of type 'PromiseLike<string>'.". We need to suppress this error because
    // we need to mock the `getTokenAsync` function for testing purposes.
    // @ts-expect-error
    spyOn(mcts, 'getTokenAsync').and.returnValue(['sample-csrf-token']);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should expect request body to be a FormData constructor', () => {
    httpClient.post('/api', {data: 'test'}).subscribe(
      response => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.constructor.name).toEqual('FormData');
    req.flush({data: 'test'});
  });
});
