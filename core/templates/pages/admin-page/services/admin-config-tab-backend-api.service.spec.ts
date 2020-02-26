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
 * @fileoverview Unit tests for AdminConfigTabBackendApiService.
 */

// TODO(#7222): Remove the following block of unnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
require('pages/admin-page/services/admin-config-tab-backend-api.service');

describe('Admin Config Tab Backend API service', function() {
  let AdminConfigTabBackendApiService = null;
  let $httpBackend = null;
  let CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    let ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    AdminConfigTabBackendApiService = $injector.get(
      'AdminConfigTabBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should revert specified config property to default value',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('POST', '/adminhandler').respond(200);
      AdminConfigTabBackendApiService.revertConfigProperty(
        'promo_bar_enabled').then(successHandler, failHandler);

      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
  it('should save new config properties',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('POST', '/adminhandler').respond(200);
      AdminConfigTabBackendApiService.saveConfigProperties({
        promo_bar_enabled: true
      }).then(successHandler, failHandler);

      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
