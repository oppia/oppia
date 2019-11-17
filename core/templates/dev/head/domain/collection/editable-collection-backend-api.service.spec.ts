// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableCollectionBackendApiService.
 */

require('domain/collection/editable-collection-backend-api.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('services/csrf-token.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Editable collection backend API service', function() {
  var EditableCollectionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;
  var CsrfService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    EditableCollectionBackendApiService = $injector.get(
      'EditableCollectionBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    // Sample collection object returnable from the backend
    sampleDataResults = {
      collection: {
        id: '0',
        title: 'Collection Under Test',
        category: 'Test',
        objective: 'To pass',
        version: '1',
        nodes: [{
          exploration_id: '0'
        }],
        next_exploration_ids: [],
        completed_exploration_ids: []
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing collection from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_editor_handler/data/0').respond(
        sampleDataResults);
      EditableCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_editor_handler/data/1').respond(
        500, 'Error loading collection 1.');
      EditableCollectionBackendApiService.fetchCollection('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 1.');
    }
  );

  it('should update a collection after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var collection = null;

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_editor_handler/data/0').respond(
        sampleDataResults);

      EditableCollectionBackendApiService.fetchCollection('0').then(
        function(data) {
          collection = data;
        });
      $httpBackend.flush();

      collection.title = 'New Title';
      collection.version = '2';
      var collectionWrapper = {
        collection: collection
      };

      $httpBackend.expect('PUT', '/collection_editor_handler/data/0').respond(
        collectionWrapper);

      // Send a request to update collection
      EditableCollectionBackendApiService.updateCollection(
        collection.id, collection.version, collection.title, []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
