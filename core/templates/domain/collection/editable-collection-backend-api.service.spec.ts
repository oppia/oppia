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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {EditableCollectionBackendApiService} from 'domain/collection/editable-collection-backend-api.service';
import {Collection} from 'domain/collection/collection.model';

describe('Editable collection backend API service', () => {
  let editableCollectionBackendApiService: EditableCollectionBackendApiService;
  let httpTestingController: HttpTestingController;
  // Sample collection object returnable from the backend.
  let sampleDataResults = {
    collection: {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      version: 1,
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
      tags: null,
      schema_version: null,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    editableCollectionBackendApiService = TestBed.get(
      EditableCollectionBackendApiService
    );
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing collection from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableCollectionBackendApiService
      .fetchCollectionAsync('0')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/collection_editor_handler/data/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    let collectionObject = Collection.create(sampleDataResults.collection);

    expect(successHandler).toHaveBeenCalledWith(collectionObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableCollectionBackendApiService
      .fetchCollectionAsync('1')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/collection_editor_handler/data/1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading collection 1',
      },
      {
        status: 500,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading collection 1');
  }));

  it('should update a collection after fetching it from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: 1,
      nodes: [],
      language_code: null,
      tags: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
    };
    let collection: Collection = Collection.create(
      sampleCollectionBackendObject
    );

    let collectionDict = sampleDataResults;
    // Loading a collection the first time should fetch it from the backend.
    editableCollectionBackendApiService.fetchCollectionAsync('0').then(data => {
      collection = data;
    });
    let req = httpTestingController.expectOne(
      '/collection_editor_handler/data/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(collection.id).toBe('0');

    collectionDict.collection.title = 'New Title';
    collectionDict.collection.version = 2;
    collection = Collection.create(collectionDict.collection);

    // Send a request to update collection.
    editableCollectionBackendApiService
      .updateCollectionAsync(
        collectionDict.collection.id,
        collectionDict.collection.version,
        collectionDict.collection.title,
        []
      )
      .then(successHandler, failHandler);
    req = httpTestingController.expectOne('/collection_editor_handler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(collectionDict);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(collection);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to update a collection after fetching it from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: 1,
      nodes: [],
      language_code: null,
      tags: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
    };
    let collection: Collection = Collection.create(
      sampleCollectionBackendObject
    );
    let collectionDict = sampleDataResults;
    // Loading a collection the first time should fetch it from the backend.
    editableCollectionBackendApiService.fetchCollectionAsync('1').then(data => {
      collection = data;
    });
    let req = httpTestingController.expectOne(
      '/collection_editor_handler/data/1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(collection.id).toBe('0');

    // Sending a request to update collection with invalid Id.
    editableCollectionBackendApiService
      .updateCollectionAsync(
        'invalidId',
        collectionDict.collection.version,
        collectionDict.collection.title,
        []
      )
      .then(successHandler, failHandler);
    req = httpTestingController.expectOne(
      '/collection_editor_handler/data/invalidId'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {
        error: 'Error updating collection.',
      },
      {
        status: 500,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error updating collection.');
  }));
});
