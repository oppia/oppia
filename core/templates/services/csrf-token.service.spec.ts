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
 * @fileoverview Unit tests for the csrf service
 */
import { CsrfTokenService } from 'services/csrf-token.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('Csrf Token Service', function() {
  let csrfTokenService: CsrfTokenService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    csrfTokenService = TestBed.inject(CsrfTokenService);
  });

  it('should correctly set the csrf token', (done) => {
    csrfTokenService.initializeToken();

    csrfTokenService.getTokenAsync().then(function(token) {
      expect(token).toEqual('sample-csrf-token');
    }).then(done, done.fail);

    let req = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('GET');
    req.flush('12345{"token": "sample-csrf-token"}');

    httpTestingController.verify();
  });

  it('should throw error when the request failed', (done) => {
    csrfTokenService.initializeToken();

    csrfTokenService.getTokenAsync().then(done.fail, done);

    let req = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('GET');
    req.error(
      new ErrorEvent('network error'), {status: 500, statusText: 'error'}
    );

    httpTestingController.verify();
  });

  it('should throw error when the request failed', (done) => {
    csrfTokenService.initializeToken();

    csrfTokenService.getTokenAsync().then(done.fail, done);

    let req = httpTestingController.expectOne('/csrfhandler');
    expect(req.request.method).toEqual('GET');
    req.error(
      new ErrorEvent('network error'), {status: 500, statusText: 'error'}
    );

    httpTestingController.verify();
  });


  it('should error if initialize is called more than once', () => {
    csrfTokenService.initializeToken();

    expect(() => csrfTokenService.initializeToken())
      .toThrowError('Token request has already been made');
  });

  it('should error if getTokenAsync is called before initialize', () => {
    try {
      csrfTokenService.getTokenAsync();
    } catch (e) {
      expect(e).toEqual(new Error('Token needs to be initialized'));
    }
  });
});
