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
 * @fileoverview Unit tests for AuthInterceptor.
 */

import { HttpClient, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { of } from 'rxjs';

import { AuthInterceptor } from 'services/auth-interceptor.service';
import { AuthService } from 'services/auth.service';
import { MockAngularFireAuth } from 'tests/unit-test-utils';


describe('Auth interceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {provide: AngularFireAuth, useValue: new MockAngularFireAuth()},
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
      ]
    });

    authService = TestBed.inject(AuthService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const methods = [
    'DELETE', 'GET', 'HEAD', 'JSONP', 'OPTIONS', 'PATCH', 'POST', 'PUT'
  ];

  for (const method of methods) {
    it('should not authorize ' + method + ' requests when token is null',
      () => {
        spyOnProperty(authService, 'idToken$', 'get')
          .and.returnValue(of(null));

        httpClient.request(new HttpRequest(method, '/abc', null)).subscribe(
          response => expect(response).toBeTruthy(),
          error => expect(error).toBeFalsy());

        const testRequest = httpTestingController.expectOne('/abc');

        expect(testRequest.request.headers.has('Authorization')).toBeFalse();
      });

    it('should authorize ' + method + ' requests when token is not null',
      () => {
        spyOnProperty(authService, 'idToken$', 'get')
          .and.returnValue(of('VALID_JWT'));

        httpClient.request(new HttpRequest(method, '/abc', null)).subscribe(
          response => expect(response).toBeTruthy(),
          error => expect(error).toBeFalsy());

        const testRequest = httpTestingController.expectOne('/abc');

        expect(testRequest.request.headers.has('Authorization')).toBeTrue();
        expect(testRequest.request.headers.get('Authorization'))
          .toEqual('Bearer VALID_JWT');
      });
  }
});
