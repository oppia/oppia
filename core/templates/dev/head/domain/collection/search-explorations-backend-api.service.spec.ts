// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SearchExplorationsBackendApiService.
 */

require('domain/collection/search-explorations-backend-api.service.ts');

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Exploration search backend API service', function() {
  var SearchExplorationsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    SearchExplorationsBackendApiService = $injector.get(
      'SearchExplorationsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should call the provided success handler on HTTP success', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('three'));

    $httpBackend.expect('GET', '/exploration/metadata_search?q=' + query)
      .respond(200, {collection_node_metadata_list: []});
    SearchExplorationsBackendApiService.fetchExplorations('three')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should search for explorations from the backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('count'));

    // Search result object returnable from the backend
    var searchResults = {
      collection_node_metadata_list: [{
        id: '12',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Protractor Test'
      }, {
        id: '4',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Three Balls'
      }]
    };

    $httpBackend
      .expect('GET', '/exploration/metadata_search?q=' + query)
      .respond(200, searchResults);
    SearchExplorationsBackendApiService.fetchExplorations('count')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith(searchResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('oppia'));

    $httpBackend
      .expect('GET', '/exploration/metadata_search?q=' + query).respond(500);
    SearchExplorationsBackendApiService.fetchExplorations('oppia')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
