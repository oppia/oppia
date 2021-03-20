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
import { fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import {HTTP_INTERCEPTORS, HttpClient} from '@angular/common/http';

import {
  RequestInterceptor
} from 'services/request-interceptor.service';
import { CsrfTokenService } from './csrf-token.service';


fdescribe('Request Interceptor Service', () => {
  let csrfService: CsrfTokenService = null;
  let httpClient: HttpClient = null;
  let httpTestingController: HttpTestingController = null;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: RequestInterceptor,
          multi: true
        }
      ]
    });

    csrfService = TestBed.inject(CsrfTokenService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      console.log('Called');
      return Promise.resolve('sample-csrf-token');
    });
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should expect request body to be a FormData constructor', (done) => {
    httpClient.post('/api', {data: 'test'}).subscribe(
      response => {
        expect(response).toBeTruthy();
        done();
      }
    );

    let req = httpTestingController.expectOne('/api');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.constructor.name).toEqual('FormData');
    req.flush({data: 'test'});
  });
});
