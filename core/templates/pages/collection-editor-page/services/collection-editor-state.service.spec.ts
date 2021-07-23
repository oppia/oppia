// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CollectionEditorStateService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { CollectionRightsBackendApiService } from 'domain/collection/collection-rights-backend-api.service';
import { CollectionRights, CollectionRightsBackendDict } from 'domain/collection/collection-rights.model';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { EditableCollectionBackendApiService } from 'domain/collection/editable-collection-backend-api.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from './collection-editor-state.service';

describe('Collection editor state service', () => {
  let collectionEditorStateService: CollectionEditorStateService = null;
  let collectionRightsBackendApiService:
    CollectionRightsBackendApiService = null;
  let undoRedoService: UndoRedoService;
  let alertsService: AlertsService;
  let editableCollectionBackendApiService: EditableCollectionBackendApiService;

  let sampleCollectionRightsDict: CollectionRightsBackendDict;
  let sampleCollectionRights: CollectionRights;
  let sampleCollectionBackendDict: CollectionBackendDict = null;
  let sampleCollection: Collection = null;

  let testSubscriptions: Subscription;
  let alertsSpy: jasmine.Spy = null;
  const collectionInitializedSpy = jasmine.createSpy('collectionInitialized');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditableCollectionBackendApiService,
        CollectionRightsBackendApiService,
        AlertsService
      ]
    });

    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    undoRedoService = TestBed.inject(UndoRedoService);
    editableCollectionBackendApiService = TestBed.inject(
      EditableCollectionBackendApiService);
    collectionRightsBackendApiService = TestBed.inject(
      CollectionRightsBackendApiService);
    alertsService = TestBed.inject(AlertsService);

    sampleCollectionBackendDict = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: 1,
      nodes: [],
      language_code: null,
      schema_version: null,
      tags: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    sampleCollection = Collection.create(sampleCollectionBackendDict);

    sampleCollectionRightsDict = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    };

    sampleCollectionRights = CollectionRights.create(
      sampleCollectionRightsDict);
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      collectionEditorStateService.onCollectionInitialized.subscribe(
        collectionInitializedSpy));

    alertsSpy = spyOn(alertsService, 'addWarning').and.returnValue(null);
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should fire an init event after loading the first collection', () => {
    let successCallback = () => {
      expect(collectionInitializedSpy).toHaveBeenCalled();
    };
    collectionEditorStateService.loadCollection('5', successCallback);
  }
  );

  it('should fire an update event after loading more collections', () => {
    // Load initial collection.
    collectionEditorStateService.loadCollection('5', () => {
      // Load a second collection.
      collectionEditorStateService.loadCollection('1', () => {
        expect(collectionInitializedSpy).toHaveBeenCalled();
      });
    });
  });

  it('should track whether it is currently loading the collection', () => {
    expect(collectionEditorStateService.isLoadingCollection()).toBe(false);

    collectionEditorStateService.loadCollection('5', () => {
      expect(collectionEditorStateService.isLoadingCollection()).toBe(false);
    });
    expect(collectionEditorStateService.isLoadingCollection()).toBe(true);
  });

  it('should report that a collection has loaded through loadCollection()',
    () => {
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(false);

      collectionEditorStateService.loadCollection('5', () => {
        expect(collectionEditorStateService.hasLoadedCollection()).toBe(true);
      });
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(false);
    }
  );

  it('should initially return an empty collection', () => {
    let collection = collectionEditorStateService.getCollection();
    expect(collection.getId()).toBeNull();
    expect(collection.getTitle()).toBeNull();
    expect(collection.getObjective()).toBeNull();
    expect(collection.getCategory()).toBeNull();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should initially return an empty collection rights', () => {
    let collectionRights = collectionEditorStateService.getCollectionRights();
    expect(collectionRights.getCollectionId()).toBeNull();
    expect(collectionRights.canEdit()).toBeNull();
    expect(collectionRights.canUnpublish()).toBeNull();
    expect(collectionRights.isPrivate()).toBeNull();
    expect(collectionRights.getOwnerNames()).toEqual([]);
  });

  it('should load a collection successfully', fakeAsync(() => {
    let fetchCollectionSpy = spyOn(
      editableCollectionBackendApiService, 'fetchCollectionAsync')
      .and.resolveTo(sampleCollection);
    const loadCollectionSuccessCb = jasmine.createSpy('success');

    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionSuccessCb);
    tick();

    expect(fetchCollectionSpy).toHaveBeenCalled();
    expect(loadCollectionSuccessCb).toHaveBeenCalled();
  }));

  it('should throw error if there was an error while ' +
    'loading collection', fakeAsync(() => {
    let fetchCollectionSpy = spyOn(
      editableCollectionBackendApiService, 'fetchCollectionAsync')
      .and.rejectWith();
    const loadCollectionSuccessCb = jasmine.createSpy('success');

    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionSuccessCb);
    tick();

    expect(fetchCollectionSpy).toHaveBeenCalled();
    expect(loadCollectionSuccessCb).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error when loading the collection.');
  }));

  it('should load a collection rights successfully', fakeAsync(() => {
    let fetchCollectionSpy = spyOn(
      collectionRightsBackendApiService, 'fetchCollectionRightsAsync')
      .and.resolveTo(sampleCollectionRights);
    const loadCollectionRightsSuccessCb = jasmine.createSpy('success');

    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionRightsSuccessCb);
    collectionEditorStateService.setCollectionRights(sampleCollectionRights);
    tick();

    expect(fetchCollectionSpy).toHaveBeenCalled();
    expect(loadCollectionRightsSuccessCb).toHaveBeenCalled();
  }));

  it('should throw error if there was an error while ' +
    'loading collection rights', fakeAsync(() => {
    let fetchCollectionSpy = spyOn(
      collectionRightsBackendApiService, 'fetchCollectionRightsAsync')
      .and.rejectWith();
    const loadCollectionRightsSuccessCb = jasmine.createSpy('success');

    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionRightsSuccessCb);
    tick();

    expect(fetchCollectionSpy).toHaveBeenCalled();
    expect(loadCollectionRightsSuccessCb).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error when loading the collection rights.');
  }));

  it('should not save the collection if there are no pending changes',
    fakeAsync(() => {
      // Setting pending changes to be false.
      spyOn(undoRedoService, 'hasChanges').and.returnValue(false);
      const saveCollectionsuccessCb = jasmine.createSpy('success');
      const loadCollectionRightsSuccessCb = jasmine.createSpy('success');

      // Load initial collection.
      collectionEditorStateService.loadCollection(
        'sample_collection_id', loadCollectionRightsSuccessCb);
      tick();

      collectionEditorStateService.setCollection(sampleCollection);

      let savedChanges = collectionEditorStateService.saveCollection(
        'commit message', saveCollectionsuccessCb);

      expect(saveCollectionsuccessCb).not.toHaveBeenCalled();
      expect(savedChanges).toBe(false);
    }
    ));

  it('should save pending changes of a collection', fakeAsync(() => {
    // Setting pending changes to be true.
    spyOn(undoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(editableCollectionBackendApiService, 'updateCollectionAsync')
      .and.resolveTo(sampleCollection);
    const saveCollectionsuccessCb = jasmine.createSpy('success');
    const loadCollectionRightsSuccessCb = jasmine.createSpy('success');


    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionRightsSuccessCb);
    tick();

    collectionEditorStateService.setCollection(sampleCollection);

    let savedChanges = collectionEditorStateService.saveCollection(
      'commit message', saveCollectionsuccessCb);
    tick();

    expect(saveCollectionsuccessCb).toHaveBeenCalled();
    expect(savedChanges).toBe(true);
  }));

  it('should fail to save collection in case of backend ' +
    'error', fakeAsync(() => {
    // Setting pending changes to be true.
    spyOn(undoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(editableCollectionBackendApiService, 'updateCollectionAsync')
      .and.rejectWith();
    const saveCollectionsuccessCb = jasmine.createSpy('success');
    const loadCollectionRightsSuccessCb = jasmine.createSpy('success');


    // Load initial collection.
    collectionEditorStateService.loadCollection(
      'sample_collection_id', loadCollectionRightsSuccessCb);
    tick();

    collectionEditorStateService.setCollection(sampleCollection);

    collectionEditorStateService.saveCollection(
      'commit message', saveCollectionsuccessCb);
    tick();

    expect(saveCollectionsuccessCb).not.toHaveBeenCalled();
    expect(alertsSpy).toHaveBeenCalledWith(
      'There was an error when saving the collection.');
  }));

  it('should fail to save the collection without first loading one',
    () => {
      const saveCollectionsuccessCb = jasmine.createSpy('success');
      expect(() => {
        collectionEditorStateService.saveCollection(
          'Commit message', saveCollectionsuccessCb);
      }).toThrowError('Cannot save a collection before one is loaded.');
    }
  );

  it('should check whether a collection is being saved', () => {
    let result = collectionEditorStateService.isSavingCollection();

    expect(result).toBe(false);
  });
});
