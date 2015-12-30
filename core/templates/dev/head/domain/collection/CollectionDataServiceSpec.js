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
 * @fileoverview Unit tests for CollectionDataService.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

describe('Collection Data Service', function() {
  var cds = null;
  var sampleDataResults = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    cds = $injector.get('CollectionDataService');
    $scope = $injector.get('$rootScope').$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample collection object returnable from the backend
    sampleDataResults = {
      collection: {
        id: '0',
        title: 'Collection Under Test',
        category: 'Test',
        objective: 'To pass',
        schema_version: '1',
        nodes: [{
          exploration_id: '0',
          prerequisite_skills: [],
          acquired_skills: []
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

    $httpBackend.expect('GET', '/collectionhandler/data/0').respond(
      sampleDataResults);
    cds.fetchCollection('0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should load a cached collection after fetching it from the backend',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a collection the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/collectionhandler/data/0').respond(
      sampleDataResults);
    cds.loadCollection('0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // Loading a collection the second time should not fetch it.
    cds.loadCollection('0').then(successHandler, failHandler);

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the rejection handler if the backend request failed',
      function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a collection the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/collectionhandler/data/0').respond(
      500, 'Error loading collection 0.');
    cds.loadCollection('0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading collection 0.');
  });

  it('should report caching and support clearing the cache', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(cds.isCached('0')).toBeFalsy();

    // Loading a collection the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/collectionhandler/data/0').respond(
      sampleDataResults);
    cds.loadCollection('0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // The collection should now be cached.
    expect(cds.isCached('0')).toBeTruthy();

    // The collection should be loadable from the cache.
    cds.loadCollection('0').then(successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    cds.clearCollectionCache();
    expect(cds.isCached('0')).toBeFalsy();

    $httpBackend.expect('GET', '/collectionhandler/data/0').respond(
      sampleDataResults);
    cds.loadCollection('0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();
  });
});
