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

require('services/CsrfTokenService.ts');

describe('Csrf Token Service', function() {
  var $httpBackend = null;
  var $q = null;
  var $rootScope = null;
  var CsrfTokenService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$httpBackend_, _$q_, _$rootScope_, _CsrfTokenService_) {
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    CsrfTokenService = _CsrfTokenService_;

    this.scope = $rootScope.$new();

    spyOn($, 'ajax').and.returnValue($q.resolve({token: 'sample-csrf-token'}));
  }));

  it('should correctly set the csrf token', function(done) {
    CsrfTokenService.initializeToken();

    CsrfTokenService.getTokenAsync().then(function(token) {
      expect(token).toEqual('sample-csrf-token');
    }).then(done, done.fail);

    this.scope.$digest(); // Force all promises to evaluate.
  });

  it('should error if initialize is called more than once', function() {
    CsrfTokenService.initializeToken();

    expect(CsrfTokenService.initializeToken)
      .toThrowError('Token request has already been made');
  });

  it('should error if getTokenAsync is called before initialize', function() {
    expect(CsrfTokenService.getTokenAsync)
      .toThrowError('Token needs to be initialized');
  });
});
