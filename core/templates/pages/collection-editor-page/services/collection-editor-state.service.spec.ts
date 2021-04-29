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
import { TestBed, waitForAsync } from '@angular/core/testing';
import { CollectionRightsBackendApiService } from 'domain/collection/collection-rights-backend-api.service';
import { CollectionRights, CollectionRightsBackendDict } from 'domain/collection/collection-rights.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { EditableCollectionBackendApiService } from 'domain/collection/editable-collection-backend-api.service';
import { Subscription } from 'rxjs';
import { TranslatorProviderForTests } from 'tests/test.extras';
import { CollectionEditorStateService } from './collection-editor-state.service';

describe('Collection editor state service', () => {
  let collectionEditorStateService = null;
  let collectionUpdateService = null;
  let mockEditableCollectionBackendApiService = null;
  let mockCollectionRightsBackendApiService = null;
  let secondBackendCollectionObject = null;
  let unpublishablePublicCollectionRightsObject = null;
  let testSubscriptions: Subscription;
  const collectionInitializedSpy = jasmine.createSpy('collectionInitialized');

  class MockEditableCollectionBackendApiService {
    newBackendCollectionObject: CollectionBackendDict;
    failure = null;

    private async _fetchOrUpdateCollectionAsync(): Promise<
      void | Collection> {
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(
            Collection.create(
              this.newBackendCollectionObject
            )
          );
        } else {
          reject();
        }
      });
    }



    get fetchCollectionAsync(): () => Promise<void | Collection> {
      return this._fetchOrUpdateCollectionAsync;
    }

    get updateCollectionAsync(): () => Promise<void | Collection> {
      return this._fetchOrUpdateCollectionAsync;
    }
  }

  class MockCollectionRightsBackendApiService {
    backendCollectionRightsObject: CollectionRightsBackendDict;
    failure = null;

    private async _fetchCollectionRightsAsync(): Promise<
      void | CollectionRights> {
      return new Promise((resolve, reject) => {
        if (!this.failure) {
          resolve(CollectionRights.create(
            this.backendCollectionRightsObject
          ));
        } else {
          reject();
        }
      });
    }

    get fetchCollectionRightsAsync(): () => Promise<void | CollectionRights> {
      return this._fetchCollectionRightsAsync;
    }
  }

  beforeEach(waitForAsync(() => {
    angular.mock.module('oppia', TranslatorProviderForTests);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: EditableCollectionBackendApiService,
          useClass: MockEditableCollectionBackendApiService
        },
        {
          provide: CollectionRightsBackendApiService,
          useClass: MockCollectionRightsBackendApiService
        }
      ]
    });
    mockEditableCollectionBackendApiService =
    new MockEditableCollectionBackendApiService();
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    mockCollectionRightsBackendApiService =
    new MockCollectionRightsBackendApiService();
    collectionUpdateService = TestBed.inject(CollectionUpdateService);

    mockEditableCollectionBackendApiService.newBackendCollectionObject = {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      language_code: 'en',
      schema_version: '3',
      version: '1',
      nodes: [{
        exploration_id: '0'
      }, {
        exploration_id: '1'
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    secondBackendCollectionObject = {
      id: '5',
      title: 'Interesting collection',
      category: 'Test',
      objective: 'To be interesting',
      language_code: 'en',
      tags: [],
      schema_version: '3',
      version: '3',
      nodes: [{
        exploration_id: '0'
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    let privateCollectionRightsObject = {
      collection_id: '5',
      can_edit: 'true',
      can_unpublish: 'false',
      is_private: 'true',
      owner_names: ['A']
    };

    mockCollectionRightsBackendApiService.backendCollectionRightsObject =
privateCollectionRightsObject;

    unpublishablePublicCollectionRightsObject = {
      collection_id: '5',
      can_edit: 'true',
      can_unpublish: 'true',
      is_private: 'false',
      owner_names: ['A']
    };
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      collectionEditorStateService.onCollectionInitialized.subscribe(
        collectionInitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the collection from the backend', () => {
    spyOn(
      mockEditableCollectionBackendApiService,
      'fetchCollectionAsync').and.callThrough();

    let successCallback = () => {
      expect(mockEditableCollectionBackendApiService.fetchCollectionAsync)
        .toHaveBeenCalled();
    };
    collectionEditorStateService.loadCollection(5, successCallback);
  });

  it('should request to load the collection rights from the backend',
    () => {
      spyOn(mockCollectionRightsBackendApiService, 'fetchCollectionRightsAsync')
        .and.callThrough();
      let successCallback = () => {
        expect(mockCollectionRightsBackendApiService.fetchCollectionRightsAsync)
          .toHaveBeenCalled();
      };
      collectionEditorStateService.loadCollection(5, successCallback);
    }
  );

  it('should fire an init event after loading the first collection', () => {
    let successCallback = () => {
      expect(collectionInitializedSpy).toHaveBeenCalled();
    };
    collectionEditorStateService.loadCollection(5, successCallback);
  }
  );

  it('should fire an update event after loading more collections', () => {
    // Load initial collection.
    collectionEditorStateService.loadCollection(5, () => {
      // Load a second collection.
      collectionEditorStateService.loadCollection(1, () => {
        expect(collectionInitializedSpy).toHaveBeenCalled();
      });
    });
  });

  it('should track whether it is currently loading the collection', () => {
    expect(collectionEditorStateService.isLoadingCollection()).toBe(false);

    collectionEditorStateService.loadCollection(5, () => {
      expect(collectionEditorStateService.isLoadingCollection()).toBe(false);
    });
    expect(collectionEditorStateService.isLoadingCollection()).toBe(true);
  });

  it('should indicate a collection is no longer loading after an error',
    () => {
      expect(collectionEditorStateService.isLoadingCollection()).toBe(false);
      mockEditableCollectionBackendApiService.failure = 'Internal 500 error';

      collectionEditorStateService.loadCollection(5, () => {
        expect(collectionEditorStateService.isLoadingCollection()).toBe(false);
      });
      expect(collectionEditorStateService.isLoadingCollection()).toBe(true);
    }
  );

  it('should report that a collection has loaded through loadCollection()',
    () => {
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(false);

      collectionEditorStateService.loadCollection(5, () => {
        expect(collectionEditorStateService.hasLoadedCollection()).toBe(true);
      });
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(false);
    }
  );

  it('should report that a collection has loaded through setCollection()',
    () => {
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(false);
      let newCollection = Collection.create(
        secondBackendCollectionObject);
      collectionEditorStateService.setCollection(newCollection);
      expect(collectionEditorStateService.hasLoadedCollection()).toBe(true);
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

  it('should return the last collection loaded as the same object', () => {
    let previousCollection = collectionEditorStateService.getCollection();
    let expectedCollection = Collection.create(
      mockEditableCollectionBackendApiService.newBackendCollectionObject);
    expect(previousCollection).not.toEqual(expectedCollection);

    collectionEditorStateService.loadCollection(5, () => {
      let actualCollection = collectionEditorStateService.getCollection();
      expect(actualCollection).toEqual(expectedCollection);

      // Although the actual collection equals the expected collection, they are
      // different objects. Ensure that the actual collection is still the same
      // object from before loading it, however.
      expect(actualCollection).toBe(previousCollection);
      expect(actualCollection).not.toBe(expectedCollection);
    });
  });


  it('should return the last collection rights loaded as the same object',
    () => {
      let previousCollectionRights = (
        collectionEditorStateService.getCollectionRights());
      let expectedCollectionRights = CollectionRights.create(
        mockCollectionRightsBackendApiService.backendCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      collectionEditorStateService.loadCollection(5, () => {
        let actualCollectionRights = (
          collectionEditorStateService.getCollectionRights());
        expect(actualCollectionRights).toEqual(expectedCollectionRights);

        // Although the actual collection rights equals the expected collection
        // rights, they are different objects. Ensure that the actual collection
        // rights is still the same object from before loading it, however.
        expect(actualCollectionRights).toBe(previousCollectionRights);
        expect(actualCollectionRights).not.toBe(expectedCollectionRights);
      });
    }
  );

  it('should be able to set a new collection with an in-place copy',
    () => {
      let previousCollection = collectionEditorStateService.getCollection();
      let expectedCollection = Collection.create(
        secondBackendCollectionObject);
      expect(previousCollection).not.toEqual(expectedCollection);

      collectionEditorStateService.setCollection(expectedCollection);

      let actualCollection = collectionEditorStateService.getCollection();
      expect(actualCollection).toEqual(expectedCollection);

      // Although the actual collection equals the expected collection, they are
      // different objects. Ensure that the actual collection is still the same
      // object from before loading it, however.
      expect(actualCollection).toBe(previousCollection);
      expect(actualCollection).not.toBe(expectedCollection);
    }
  );

  it('should be able to set a new collection rights with an in-place copy',
    () => {
      let previousCollectionRights = (
        collectionEditorStateService.getCollectionRights());
      let expectedCollectionRights = CollectionRights.create(
        unpublishablePublicCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      collectionEditorStateService.setCollectionRights(
        expectedCollectionRights);

      let actualCollectionRights = (
        collectionEditorStateService.getCollectionRights());
      expect(actualCollectionRights).toEqual(expectedCollectionRights);

      // Although the actual collection rights equals the expected collection
      // rights, they are different objects. Ensure that the actual collection
      // rights is still the same object from before loading it, however.
      expect(actualCollectionRights).toBe(previousCollectionRights);
      expect(actualCollectionRights).not.toBe(expectedCollectionRights);
    }
  );


  it('should fire an update event after setting the new collection',
    () => {
      // Load initial collection.
      collectionEditorStateService.loadCollection(5, () => {
        let newCollection = Collection.create(
          secondBackendCollectionObject);
        collectionEditorStateService.setCollection(newCollection);

        expect(collectionInitializedSpy).toHaveBeenCalled();
      });
    }
  );

  it('should fail to save the collection without first loading one',
    () => {
      expect(() => {
        collectionEditorStateService.saveCollection('Commit message');
      }).toThrowError('Cannot save a collection before one is loaded.');
    }
  );

  it('should not save the collection if there are no pending changes',
    () => {
      collectionEditorStateService.loadCollection(5, () => {
        expect(collectionEditorStateService.saveCollection(
          'Commit message')).toBe(false);
      });
    }
  );

  it('should be able to save the collection and pending changes', () => {
    spyOn(
      mockEditableCollectionBackendApiService,
      'updateCollectionAsync').and.callThrough();

    collectionEditorStateService.loadCollection(0, () => {
      expect(collectionEditorStateService.saveCollection(
        'Commit message', () => {
          let expectedId = '0';
          let expectedVersion = '1';
          let expectedCommitMessage = 'Commit message';
          let updateCollectionSpy = (
            mockEditableCollectionBackendApiService.updateCollectionAsync);
          expect(updateCollectionSpy).toHaveBeenCalledWith(
            expectedId, expectedVersion, expectedCommitMessage,
            jasmine.any(Object));
        })).toBe(true);
    });
    collectionUpdateService.setCollectionTitle(
      collectionEditorStateService.getCollection(), 'New title');
  });

  it('should fire an update event after saving the collection', () => {
    collectionEditorStateService.loadCollection(5, () => {
      collectionEditorStateService.saveCollection('Commit message', () => {
        expect(collectionInitializedSpy).toHaveBeenCalled();
      });
    });
    collectionUpdateService.setCollectionTitle(
      collectionEditorStateService.getCollection(), 'New title');
  });

  it('should track whether it is currently saving the collection', () => {
    collectionEditorStateService.loadCollection(5, () => {
      expect(collectionEditorStateService.isSavingCollection()).toBe(false);
      collectionEditorStateService.saveCollection('Commit message', () => {
        expect(collectionEditorStateService.isSavingCollection()).toBe(false);
      });
      expect(collectionEditorStateService.isSavingCollection()).toBe(true);
    });
    collectionUpdateService.setCollectionTitle(
      collectionEditorStateService.getCollection(), 'New title');
  });

  it('should indicate a collection is no longer saving after an error',
    () => {
      collectionEditorStateService.loadCollection(5, () => {
        expect(collectionEditorStateService.isSavingCollection()).toBe(false);
        mockEditableCollectionBackendApiService.failure = 'Internal 500 error';

        collectionEditorStateService.saveCollection('Commit message', () => {
          expect(collectionEditorStateService.isSavingCollection()).toBe(false);
        });
        expect(collectionEditorStateService.isSavingCollection()).toBe(true);
      });
      collectionUpdateService.setCollectionTitle(
        collectionEditorStateService.getCollection(), 'New title');
    }
  );
});
