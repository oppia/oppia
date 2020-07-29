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
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { EditableCollectionBackendApiService } from
  'domain/collection/editable-collection-backend-api.service';
import { Collection, CollectionObjectFactory } from
  'domain/collection/CollectionObjectFactory';

describe('Editable collection backend API service', () => {
  let editableCollectionBackendApiService:
    EditableCollectionBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let collectionObjectFactory: CollectionObjectFactory;
  // Sample collection object returnable from the backend.
  let sampleDataResults = {
    collection: {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      version: 1,
      nodes: [{
        exploration_id: '0'
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      },
      language_code: null,
      tags: null,
      schema_version: null
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    editableCollectionBackendApiService = TestBed.get(
      EditableCollectionBackendApiService);
    collectionObjectFactory = TestBed.get(CollectionObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing collection from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/collection_editor_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      var collectionObject = collectionObjectFactory.create(
        sampleDataResults.collection);

      expect(successHandler).toHaveBeenCalledWith(collectionObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableCollectionBackendApiService.fetchCollection('1').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/collection_editor_handler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading collection 1'
      }, {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 1');
    })
  );

  it('should update a collection after fetching it from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var collection: Collection = null;
      var collectionDict = sampleDataResults;
      // Loading a collection the first time should fetch it from the backend.
      editableCollectionBackendApiService.fetchCollection('0').then(
        (data) => {
          collection = data;
        });
      var req = httpTestingController.expectOne(
        '/collection_editor_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      collectionDict.collection.title = 'New Title';
      collectionDict.collection.version = 2;
      collection = collectionObjectFactory.create(collectionDict.collection);

      // Send a request to update collection.
      editableCollectionBackendApiService.updateCollection(
        collectionDict.collection.id,
        collectionDict.collection.version,
        collectionDict.collection.title, []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne(
        '/collection_editor_handler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(collectionDict);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(collection);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
