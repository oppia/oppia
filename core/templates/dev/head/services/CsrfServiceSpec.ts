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

require('services/CsrfService.ts');

describe('Csrf Service', function () {
  var CsrfService, $httpBackend;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    CsrfService = $injector.get('CsrfService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return the correct csrf token', function() {
    var response = ')]}\'{token: \'sample csrf token\'}';
    
    $httpBackend.expect('GET', '/csrf').respond(
      200, response);

    CsrfService.fetchToken();

    expect(CsrfService.getToken()).toBe('sample csrf token');
  })

  it('should correctly set the csrf token', function() {
    CsrfService.setToken('sample csrf token');

    expect(CsrfService.getToken()).toBe('sample csrf token');
  })
})
