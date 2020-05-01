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
 * @fileoverview Unit test for ExplorationCreationBackendApiService.
 */

require('components/entity-creation-services/' +
'exploration-creation-backend-api.service.ts');

import { UpgradedServices } from 'services/UpgradedServices';

describe('Exploration Creation backend service', function() {
  var ExplorationCreationBackendService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var SAMPLE_CREATION_ID = 'id_1';
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
    ExplorationCreationBackendService = $injector.get(
      'ExplorationCreationBackendService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  fit('should create a new exploration and get the exploration id',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expectPOST('/contributehandler/create_new').respond(
        SUCCESS_STATUS_CODE, {explorationId: SAMPLE_CREATION_ID});
      ExplorationCreationBackendService.createExploration().then(
        successHandler, failHandler);

      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });

  fit('should fail to create a new exploration and call the fail handler',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expectPOST('/contributehandler/create_new').respond(
        ERROR_STATUS_CODE);
      ExplorationCreationBackendService.createExploration().then(
        successHandler, failHandler);

      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });
});
