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
// eslint-disable-next-line oppia/disallow-httpclient
import {HTTP_INTERCEPTORS, HttpClient, HttpHandler, HttpRequest} from '@angular/common/http';

import {
  MockCsrfTokenService,
  RequestInterceptor
} from 'services/request-interceptor.service';
import { CsrfTokenService } from './csrf-token.service';

describe('Request Interceptor Service', () => {
  let cts: CsrfTokenService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockCsrfTokenService: MockCsrfTokenService;
  let requestInterceptor: RequestInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: RequestInterceptor,
        multi: true
      }]
    });

    mockCsrfTokenService = TestBed.get(MockCsrfTokenService);
    requestInterceptor = TestBed.get(RequestInterceptor);
    cts = TestBed.get(CsrfTokenService);
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    // This throws "Argument of type 'string[]' is not assignable to parameter
    // of type 'PromiseLike<string>'.". We need to suppress this error because
    // we need to mock the `getTokenAsync` function for testing purposes.
    // @ts-expect-error
    spyOn(cts, 'getTokenAsync').and.returnValue(['sample-csrf-token']);
    // This throws "Argument of type '(options: any)' is not
    // assignable to parameter of type 'jqXHR<any>'.". We need to suppress
    // this error because we need to mock $.ajax to this function for
    // testing purposes.
    // @ts-expect-error
    spyOn($, 'ajax').and.callFake((options: Promise) => {
      let d = $.Deferred();
      d.resolve(
        options.dataFilter('12345{"token": "sample-csrf-token"}')
      );
      return d.promise();
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should expect request body to be a FormData constructor', () => {
    httpClient.post('/api', {data: 'test'}).subscribe(
      async(response) => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.constructor.name).toEqual('FormData');
    req.flush({data: 'test'});
  });

  it('should modify http requests body when they are intercepted', () => {
    httpClient.patch('/api', {data: 'test'}).subscribe(
      async(response) => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    expect(req.request.method).toEqual('PATCH');
    req.flush({data: 'test'});

    expect(req.request.body).toEqual({
      csrf_token: 'sample-csrf-token',
      source: document.URL,
      payload: JSON.stringify({data: 'test'})
    });
  });

  it('should not handle http requests when the body is null', () => {
    httpClient.get('/api').subscribe(
      async(response) => expect(response).toBeTruthy());
    httpClient.patch('/api2', {data: 'test'}).subscribe(
      async(response) => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    let req2 = httpTestingController.expectOne('/api2');
    expect(req.request.method).toEqual('GET');
    expect(req2.request.method).toEqual('PATCH');
    req.flush({data: 'test'});
    req2.flush({data: 'test'});

    expect(cts.getTokenAsync).toHaveBeenCalledTimes(1);
    expect(req.request.body).toBeNull();
    expect(req2.request.body).toEqual({
      csrf_token: 'sample-csrf-token',
      source: document.URL,
      payload: JSON.stringify({data: 'test'})
    });
  });

  it('should throw error if csrf Token is not initialised', () => {
    spyOn(cts, 'initializeToken').and.callFake(() => {
      throw new Error('Error');
    });

    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url'), {} as HttpHandler);
    }).toThrowError('Error');
  });

  it('should correctly set the csrf token', (done) => {
    mockCsrfTokenService.initializeToken();

    mockCsrfTokenService.getTokenAsync().then(function(token) {
      expect(token).toEqual('sample-csrf-token');
    }).then(done, done.fail);
  });

  it('should error if initialize is called more than once', () => {
    mockCsrfTokenService.initializeToken();

    expect(() => mockCsrfTokenService.initializeToken())
      .toThrowError('Token request has already been made');
  });

  it('should error if getTokenAsync is called before initialize', () => {
    try {
      mockCsrfTokenService.getTokenAsync();
    } catch (e) {
      expect(e).toEqual(new Error('Token needs to be initialized'));
    }
  });
});
