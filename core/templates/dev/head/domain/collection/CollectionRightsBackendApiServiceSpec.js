// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CollectionRightsBackendApiService.
 */

describe('Collection rights backend API service', function() {
  var CollectionRightsBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(inject(function($injector) {
    CollectionRightsBackendApiService = $injector.get(
      'CollectionRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully set a collection to be public', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // TODO(bhenning): Figure out how to test the actual payload sent with the
    // PUT request. The typical expect() syntax with a passed-in object payload
    // does not seem to be working correctly.
    $httpBackend.expect(
      'PUT', '/collection_editor_handler/rights/0').respond(
      200);
    CollectionRightsBackendApiService.setCollectionPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/collection_editor_handler/rights/0').respond(
      500, 'Error loading collection 0.');
    CollectionRightsBackendApiService.setCollectionPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
