// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
  var CREATE_NEW_COLLECTION_URL_TEMPLATE = (
    '/collection_editor/create/<collection_id>');
  var ERROR_STATUS_CODE = 500;
  // var successfulResponse = {
  //   collectionId: SAMPLE_COLLECTION_ID 
  // };
  
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.inject(function($injector) {
    CollectionCreationBackendService = $injector.get(
      'CollectionCreationBackendService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should successfully create a new collection and obtain the collection ID',
  function() {
    CollectionCreationBackendService.createCollection(
      CREATE_NEW_COLLECTION_URL_TEMPLATE);
    $httpBackend.expectPOST('/collection_editor_handler/create_new').respond(
      {collectionId: SAMPLE_COLLECTION_ID}
    );
    $httpBackend.flush();
    $rootScope.$digest();
    expect($rootScope.loadingMessage).toBe('Creating collection');
  });
});
