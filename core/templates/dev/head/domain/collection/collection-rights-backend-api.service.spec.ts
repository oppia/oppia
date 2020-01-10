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

require('domain/collection/collection-rights-backend-api.service.ts');
require('pages/collection-editor-page/collection-editor-page.directive.ts');
require('services/csrf-token.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

describe('Collection rights backend API service', function() {
  var CollectionRightsBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var CsrfService = null;
  var collectionId = '0';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', TranslatorProviderForTests));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $q) {
    CollectionRightsBackendApiService = $injector.get(
      'CollectionRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  beforeEach(function() {
    sampleDataResults = [{
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    }];
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('when .fetchCollectionRights is called', function() {
    it('should fetch collection rights', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_editor_handler/rights/' +
        collectionId).respond(sampleDataResults);
      CollectionRightsBackendApiService.fetchCollectionRights(collectionId)
        .then(successHandler, failHandler);

      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should not fetch collection rights when request failed', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_editor_handler/rights/' +
        collectionId).respond(404);
      CollectionRightsBackendApiService.fetchCollectionRights(collectionId)
        .then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(undefined);
    });
  });

  describe('when .setCollectionPublic is called', function() {
    it('should successfully set a collection to be public', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // TODO(bhenning): Figure out how to test the actual payload sent with the
      // PUT request. The typical expect() syntax with a passed-in object
      // payload does not seem to be working correctly.
      $httpBackend.expect(
        'PUT', '/collection_editor_handler/publish/0').respond(200);
      CollectionRightsBackendApiService.setCollectionPublic(collectionId, 1)
        .then(successHandler, failHandler);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should call the provided fail handler on HTTP failure', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'PUT', '/collection_editor_handler/publish/0').respond(
        500, 'Error loading collection 0.');
      CollectionRightsBackendApiService.setCollectionPublic(collectionId, 1)
        .then(successHandler, failHandler);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });
  });

  describe('when .setCollectionPrivate is called', function() {
    it('should successfully set a collection to be public', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // TODO(bhenning): Figure out how to test the actual payload sent with the
      // PUT request. The typical expect() syntax with a passed-in object
      // payload does not seem to be working correctly.
      $httpBackend.expect(
        'PUT', '/collection_editor_handler/unpublish/0').respond(200);
      CollectionRightsBackendApiService.setCollectionPrivate(collectionId, 1)
        .then(successHandler, failHandler);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should call the provided fail handler on HTTP failure', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'PUT', '/collection_editor_handler/unpublish/0').respond(
        500, 'Error loading collection 0.');
      CollectionRightsBackendApiService.setCollectionPrivate(collectionId, 1)
        .then(successHandler, failHandler);
      $httpBackend.flush();
      $rootScope.$digest();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });
  });

  describe('when .loadCollectionRights is called', function() {
    it('should report a cached collection rights after caching it', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // The collection should not currently be cached.
      expect(CollectionRightsBackendApiService.isCached(collectionId))
        .toBe(false);

      // Cache a collection.
      CollectionRightsBackendApiService.cacheCollectionRights(collectionId,
        sampleDataResults);

      // It should now be cached.
      expect(CollectionRightsBackendApiService.isCached(collectionId))
        .toBe(true);

      // A new collection should not have been fetched from the backend. Also,
      // the returned collection should match the expected collection object.
      CollectionRightsBackendApiService.loadCollectionRights(collectionId)
        .then(successHandler, failHandler);

      // http://brianmcd.com/2014/03/27/
      // a-tip-for-angular-unit-tests-with-promises.html
      $rootScope.$digest();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    });

    it('should not report a cached collection rights if it\'s not cached',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expect('GET', '/collection_editor_handler/rights/' +
          collectionId).respond(sampleDataResults);
        expect(CollectionRightsBackendApiService.isCached(collectionId))
          .toBe(false);
        CollectionRightsBackendApiService.loadCollectionRights(collectionId)
          .then(successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
        expect(failHandler).not.toHaveBeenCalled();
      }
    );
  });
});
