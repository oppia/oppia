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

describe('Csrf Token Service', function() {
  let csrfTokenService: CsrfTokenService;
  beforeEach(() => {
    csrfTokenService = new CsrfTokenService();
  });

  describe('when fetch succeeds', function() {
    beforeEach(() => {
      spyOn(window, 'fetch').and.callFake((reqInfo: RequestInfo) => {
        return Promise.resolve(
          new Response('12345{"token": "sample-csrf-token"}')
        );
      });
    });

    it('should correctly set the csrf token', (done) => {
      csrfTokenService.initializeToken();

      csrfTokenService.getTokenAsync().then(function(token) {
        expect(token).toEqual('sample-csrf-token');
      }).then(done, done.fail);
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

  describe('when fetch fails', function() {
    beforeEach(() => {
      spyOn(window, 'fetch').and.rejectWith(new Error('Test Error'));
    });

    it('should result in a handled promise rejection', () => {
      try {
        csrfTokenService.initializeToken();
      } catch (e) {
        expect(e).toEqual(new Error(
          'There has been a problem with the fetch operation: Test Error'));
      }
    });
  });
});
