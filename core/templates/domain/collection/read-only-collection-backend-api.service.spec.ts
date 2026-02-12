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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {Subscription} from 'rxjs';

import {
  ReadOnlyCollectionBackendApiService,
  ReadOnlyCollectionBackendResponse,
} from 'domain/collection/read-only-collection-backend-api.service';
import {Collection} from 'domain/collection/collection.model';

describe('Read only collection backend API service', () => {
  let readOnlyCollectionBackendApiService: ReadOnlyCollectionBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleDataResults: ReadOnlyCollectionBackendResponse = {
    meta_name: 'meta_name',
    can_edit: false,
    meta_description: 'meta_description',
    collection: {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      schema_version: 1,
      nodes: [
        {
          exploration_id: '0',
          exploration_summary: {
            last_updated_msec: 1591296737470.528,
            community_owned: false,
            objective: 'Test Objective',
            id: '44LKoKLlIbGe',
            num_views: 0,
            thumbnail_icon_url: '/subjects/Algebra.svg',
            human_readable_contributors_summary: {},
            language_code: 'en',
            thumbnail_bg_color: '#cc4b00',
            created_on_msec: 1591296635736.666,
            ratings: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
            status: 'public',
            tags: [],
            activity_type: 'exploration',
            category: 'Algebra',
            title: 'Test Title',
          },
        },
      ],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
      language_code: null,
      tags: [],
      version: null,
    },
  };
  let onCollectionLoadSpy: jasmine.Spy;
  let subscriptions: Subscription;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    readOnlyCollectionBackendApiService = TestBed.get(
      ReadOnlyCollectionBackendApiService
    );
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

  it('should load a cached collection after fetching it from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne('/collection_handler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    var collectionObject = Collection.create(sampleDataResults.collection);

    expect(successHandler).toHaveBeenCalledWith(collectionObject);
    expect(failHandler).not.toHaveBeenCalled();
    expect(onCollectionLoadSpy).toHaveBeenCalled();

    // Loading a collection the second time should not fetch it.
    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    expect(onCollectionLoadSpy).toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne('/collection_handler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading collection 0',
      },
      {
        status: 500,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading collection 0');
  }));

  it('should report caching and support clearing the cache', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Loading a collection the first time should fetch it from the backend.
    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne('/collection_handler/data/0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    var collectionObject = Collection.create(sampleDataResults.collection);

    expect(successHandler).toHaveBeenCalledWith(collectionObject);
    expect(failHandler).not.toHaveBeenCalled();

    // The collection should now be cached.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // The collection should be loadable from the cache.
    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);

    expect(onCollectionLoadSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    readOnlyCollectionBackendApiService.clearCollectionCache();
    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);
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

    var collection = Collection.create({
      id: '0',
      nodes: [],
      title: null,
      objective: null,
      tags: null,
      language_code: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
      category: null,
      version: null,
    });

    // Cache a collection.
    readOnlyCollectionBackendApiService.cacheCollection('0', collection);

    // It should now be cached. collection-playthrough.model.
    expect(readOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // A new collection should not have been fetched from the backend. Also,
    // the returned collection should match the expected collection object.
    readOnlyCollectionBackendApiService
      .loadCollectionAsync('0')
      .then(successHandler, failHandler);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(collection);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should return collection details from cache when calling ' +
      "'getCollectionDetails'",
    fakeAsync(() => {
      let collectionId = '0';
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let collectionDetails = {
        canEdit: false,
        title: 'Collection Under Test',
      };

      // Loading collection and storing it in cache.
      readOnlyCollectionBackendApiService
        .loadCollectionAsync('0')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne('/collection_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      // Getting collection details.
      let expectedCollection =
        readOnlyCollectionBackendApiService.getCollectionDetails(collectionId);

      expect(expectedCollection).toEqual(collectionDetails);
    })
  );

  it(
    'should throw error if we try to fetch collection ' +
      'details which are not cached',
    () => {
      // Trying to get collection details of a collection with an invalid Id.
      let collectionId = 'invalid';
      expect(() => {
        readOnlyCollectionBackendApiService.getCollectionDetails(collectionId);
      }).toThrowError('collection has not been fetched');
    }
  );
});
