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
 * @fileoverview Unit test for CollectionCreationBackendApiService.
 */

// eslint-disable-next-line max-len
require('components/entity-creation-services/collection-creation-backend-api.service.ts');

import { UpgradedServices } from 'services/UpgradedServices';

describe('Collection Creation backend service', function() {
  var CollectionCreationBackendService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var SAMPLE_COLLECTION_ID = 'hyuy4GUlvTqJ';
  var SUCCESS_STATUS_CODE = 200;
  var ERROR_STATUS_CODE = 500;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionCreationBackendService = $injector.get(
      'CollectionCreationBackendService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully create a new collection and obtain the collection ID',
    (done) => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expectPOST('/collection_editor_handler/create_new').respond(
        SUCCESS_STATUS_CODE, {collectionId: SAMPLE_COLLECTION_ID});
      CollectionCreationBackendService.createCollection().then(
        successHandler, failHandler);

      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      done();
    });

  it('should fail to create a new collection and call the fail handler',
    (done) => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expectPOST('/collection_editor_handler/create_new').respond(
        ERROR_STATUS_CODE);
      CollectionCreationBackendService.createCollection().then(
        successHandler, failHandler);

      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
      done();
    });
});
