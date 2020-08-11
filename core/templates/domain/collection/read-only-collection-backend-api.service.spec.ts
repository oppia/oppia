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
 * @fileoverview Unit tests for ReadOnlyCollectionBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { Subscription } from 'rxjs';

import { ReadOnlyCollectionBackendApiService } from
  'domain/collection/read-only-collection-backend-api.service';
import { CollectionObjectFactory } from
  'domain/collection/CollectionObjectFactory';

describe('Read only collection backend API service', () => {
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let collectionObjectFactory: CollectionObjectFactory = null;
  let sampleDataResults = {
    collection: {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      schema_version: 1,
      nodes: [{
        exploration_id: '0'
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      },
      language_code: null,
      tags: [],
      version: null
    }
  };
  let onCollectionLoadSpy: jasmine.Spy;
  let subscriptions: Subscription;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    readOnlyCollectionBackendApiService = TestBed.get(
      ReadOnlyCollectionBackendApiService);
    collectionObjectFactory = TestBed.get(CollectionObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    onCollectionLoadSpy = jasmine.createSpy('onCollectionLoadSpy');
    subscriptions = new Subscription();
    subscriptions.add(
      readOnlyCollectionBackendApiService.onCollectionLoad.subscribe(
        onCollectionLoadSpy
      )
    );
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    httpTestingController.verify();
  });

  it('should successfully fetch an existing collection from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      readOnlyCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne('/collection_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      var collectionObject = collectionObjectFactory.create(
        sampleDataResults.collection);

      expect(successHandler).toHaveBeenCalledWith(collectionObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should load a cached collection after fetching it from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      readOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne('/collection_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      var collectionObject = collectionObjectFactory.create(
        sampleDataResults.collection);

      expect(successHandler).toHaveBeenCalledWith(collectionObject);
      expect(failHandler).not.toHaveBeenCalled();
      expect(onCollectionLoadSpy).toHaveBeenCalled();

      // Loading a collection the second time should not fetch it.
      readOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      expect(onCollectionLoadSpy).toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      readOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne('/collection_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading collection 0'
      }, {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 0');
    })
  );

  it('should report caching and support clearing the cache', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Loading a collection the first time should fetch it from the backend.
    readOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    var req = httpTestingController.expectOne('/collection_handler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    var collectionObject = collectionObjectFactory.create(
      sampleDataResults.collection);

    expect(successHandler).toHaveBeenCalledWith(collectionObject);
    expect(failHandler).not.toHaveBeenCalled();

    // The collection should now be cached.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // The collection should be loadable from the cache.
    readOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);

    expect(onCollectionLoadSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    readOnlyCollectionBackendApiService.clearCollectionCache();
    readOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    req = httpTestingController.expectOne('/collection_handler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(collectionObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should report a cached collection after caching it', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    var collection = collectionObjectFactory.create({
      id: '0',
      nodes: [],
      title: null,
      objective: null,
      tags: null,
      language_code: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      },
      category: null,
      version: null
    });

    // Cache a collection.
    readOnlyCollectionBackendApiService.cacheCollection('0', collection);

    // It should now be cached.CollectionPlaythroughObjectFactory.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // A new collection should not have been fetched from the backend. Also,
    // the returned collection should match the expected collection object.
    readOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(collection);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
