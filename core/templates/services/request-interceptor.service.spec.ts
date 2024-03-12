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
import {TestBed} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  // eslint-disable-next-line oppia/disallow-httpclient
  HttpClient,
  HttpHandler,
  HttpRequest,
  HttpParams,
} from '@angular/common/http';

import {RequestInterceptor} from 'services/request-interceptor.service';
import {CsrfTokenService} from './csrf-token.service';

describe('Request Interceptor Service', () => {
  let csrfTokenService: CsrfTokenService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let requestInterceptor: RequestInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: RequestInterceptor,
          multi: true,
        },
      ],
    });

    requestInterceptor = TestBed.get(RequestInterceptor);
    csrfTokenService = TestBed.get(CsrfTokenService);
    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should expect request body to be a FormData constructor', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .post('/api', {data: 'test'})
      .subscribe(async response => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.constructor.name).toEqual('FormData');
    expect(reqCSFR.request.method).toEqual('GET');
    req.flush({data: 'test'});
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should modify http requests body when they are intercepted', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .patch('/api', {data: 'test'})
      .subscribe(async response => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    let reqCSRF = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('PATCH');
    expect(reqCSRF.request.method).toEqual('GET');
    req.flush({data: 'test'});
    reqCSRF.flush('12345{"token": "sample-csrf-token"}');

    expect(req.request.body).toEqual({
      csrf_token: 'sample-csrf-token',
      source: document.URL,
      payload: JSON.stringify({data: 'test'}),
    });
  });

  it('should not handle http requests when the body is null', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .get('/api')
      .subscribe(async response => expect(response).toBeTruthy());
    httpClient
      .patch('/api2', {data: 'test'})
      .subscribe(async response => expect(response).toBeTruthy());

    let req = httpTestingController.expectOne('/api');
    let req2 = httpTestingController.expectOne('/api2');
    let reqCSRF = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('GET');
    expect(req2.request.method).toEqual('PATCH');
    expect(reqCSRF.request.method).toEqual('GET');
    req.flush({data: 'test'});
    req2.flush({data: 'test'});
    reqCSRF.flush('12345{"token": "sample-csrf-token"}');

    expect(csrfTokenService.getTokenAsync).toHaveBeenCalledTimes(1);
    expect(req.request.body).toBeNull();
    expect(req2.request.body).toEqual({
      csrf_token: 'sample-csrf-token',
      source: document.URL,
      payload: JSON.stringify({data: 'test'}),
    });
  });

  it('should throw error if csrf Token is not initialised', () => {
    spyOn(csrfTokenService, 'initializeToken').and.callFake(() => {
      throw new Error('Error');
    });

    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url'),
        {} as HttpHandler
      );
    }).toThrowError('Error');
  });

  it('should correctly set the csrf token', done => {
    csrfTokenService.initializeToken();

    csrfTokenService
      .getTokenAsync()
      .then(function (token) {
        expect(token).toEqual('sample-csrf-token');
      })
      .then(done, done.fail);

    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should error if initialize is called more than once', () => {
    csrfTokenService.initializeToken();

    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');

    expect(() => csrfTokenService.initializeToken()).toThrowError(
      'Token request has already been made'
    );
  });

  it('should error if getTokenAsync is called before initialize', () => {
    try {
      csrfTokenService.getTokenAsync();
    } catch (e) {
      expect(e).toEqual(new Error('Token needs to be initialized'));
    }
  });

  it('should not throw error if params are valid', () => {
    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url', {
          params: new HttpParams({fromString: 'key=valid'}),
        }),
        {} as HttpHandler
      );
    }).toBeTruthy();
  });

  it('should not throw error if no params are specified', () => {
    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url'),
        {} as HttpHandler
      );
    }).toBeTruthy();
  });

  it('should throw error if param with null value is supplied', () => {
    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url', {
          params: new HttpParams({fromString: 'key=null'}),
        }),
        {} as HttpHandler
      );
    }).toThrowError('Cannot supply params with value "None" or "null".');

    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should throw error if param with None value is supplied', () => {
    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('GET', 'url', {
          params: new HttpParams({fromString: 'key=None'}),
        }),
        {} as HttpHandler
      );
    }).toThrowError('Cannot supply params with value "None" or "null".');

    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should throw error if null param in DELETE request', () => {
    expect(() => {
      requestInterceptor.intercept(
        new HttpRequest('DELETE', 'url', {
          params: new HttpParams({fromString: 'key=null'}),
        }),
        {} as HttpHandler
      );
    }).toThrowError('Cannot supply params with value "None" or "null".');

    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should not throw error if null param in POST request', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .post(
        '/api',
        {data: 'test'},
        {params: new HttpParams({fromString: 'key=null'})}
      )
      .subscribe(async response => expect(response).toBeTruthy());

    const req = httpTestingController.expectOne('/api?key=null');
    req.flush({data: 'test'});
    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should not throw error if null param in PUT request', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .put(
        '/api',
        {data: 'test'},
        {params: new HttpParams({fromString: 'key=null'})}
      )
      .subscribe(async response => expect(response).toBeTruthy());

    const req = httpTestingController.expectOne('/api?key=null');
    req.flush({data: 'test'});
    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });

  it('should not throw error if null param in PATCH request', () => {
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      // This throws "Argument of type 'string[]' is not assignable to parameter
      // of type 'PromiseLike<string>'.". We need to suppress this error because
      // we need to mock the `getTokenAsync` function for testing purposes.
      // @ts-expect-error
      ['sample-csrf-token']
    );

    httpClient
      .patch(
        '/api',
        {data: 'test'},
        {params: new HttpParams({fromString: 'key=null'})}
      )
      .subscribe(async response => expect(response).toBeTruthy());

    const req = httpTestingController.expectOne('/api?key=null');
    req.flush({data: 'test'});
    let reqCSFR = httpTestingController.expectOne('/csrfhandler');
    reqCSFR.flush('12345{"token": "sample-csrf-token"}');
  });
});
