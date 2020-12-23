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
 * @fileoverview Unit tests for CollectionEditorStateService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// collection-editor-state.service.ts is upgraded to Angular 8.
import { Collection } from
  'domain/collection/collection.model';
import { CollectionRights } from
  'domain/collection/collection-rights.model';
import { UpgradedServices } from 'services/UpgradedServices';
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

import { TranslatorProviderForTests } from 'tests/test.extras';

require('domain/collection/collection-update.service.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');

import { Subscription } from 'rxjs';

describe('Collection editor state service', function() {
  var CollectionEditorStateService = null;
  var CollectionUpdateService = null;
  var fakeEditableCollectionBackendApiService = null;
  var fakeCollectionRightsBackendApiService = null;
  var secondBackendCollectionObject = null;
  var unpublishablePublicCollectionRightsObject = null;
  var $rootScope = null;
  var $q = null;
  var testSubscriptions: Subscription;

  const collectionInitializedSpy = jasmine.createSpy('collectionInitialized');

  // TODO(bhenning): Consider moving this to a more shareable location.
  var FakeEditableCollectionBackendApiService = function() {
    var self = {
      newBackendCollectionObject: null,
      failure: null,
      fetchCollectionAsync: null,
      updateCollectionAsync: null
    };

    var _fetchOrUpdateCollection = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(Collection.create(
            self.newBackendCollectionObject));
        } else {
          reject();
        }
      });
    };

    self.newBackendCollectionObject = {};
    self.failure = null;
    self.fetchCollectionAsync = _fetchOrUpdateCollection;
    self.updateCollectionAsync = _fetchOrUpdateCollection;

    return self;
  };

  var FakeCollectionRightsBackendApiService = function() {
    var self = {
      backendCollectionRightsObject: null,
      failure: null,
      fetchCollectionRightsAsync: null,
    };

    var _fetchCollectionRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(
            CollectionRights.create(
              self.backendCollectionRightsObject
            ));
        } else {
          reject();
        }
      });
    };

    self.backendCollectionRightsObject = {};
    self.failure = null;
    self.fetchCollectionRightsAsync = _fetchCollectionRights;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableCollectionBackendApiService = (
      FakeEditableCollectionBackendApiService());
    $provide.value(
      'EditableCollectionBackendApiService',
      [fakeEditableCollectionBackendApiService][0]);

    fakeCollectionRightsBackendApiService = (
      FakeCollectionRightsBackendApiService());
    $provide.value(
      'CollectionRightsBackendApiService',
      [fakeCollectionRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    CollectionUpdateService = $injector.get('CollectionUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    fakeEditableCollectionBackendApiService.newBackendCollectionObject = {
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

    var privateCollectionRightsObject = {
      collection_id: '5',
      can_edit: 'true',
      can_unpublish: 'false',
      is_private: 'true',
      owner_names: ['A']
    };
    fakeCollectionRightsBackendApiService.backendCollectionRightsObject = (
      privateCollectionRightsObject);

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
      CollectionEditorStateService.onCollectionInitialized.subscribe(
        collectionInitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should request to load the collection from the backend', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'fetchCollectionAsync').and.callThrough();

    CollectionEditorStateService.loadCollection(5);
    expect(fakeEditableCollectionBackendApiService.fetchCollectionAsync)
      .toHaveBeenCalled();
  });

  it('should request to load the collection rights from the backend',
    function() {
      spyOn(fakeCollectionRightsBackendApiService, 'fetchCollectionRightsAsync')
        .and.callThrough();

      CollectionEditorStateService.loadCollection(5);
      expect(fakeCollectionRightsBackendApiService.fetchCollectionRightsAsync)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first collection',
    function() {
      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      expect(collectionInitializedSpy).toHaveBeenCalled();
    }
  );

  it('should fire an update event after loading more collections', function() {
    // Load initial collection.
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    // Load a second collection.
    CollectionEditorStateService.loadCollection(1);
    $rootScope.$apply();

    expect(collectionInitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently loading the collection', function() {
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);

    CollectionEditorStateService.loadCollection(5);
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(true);

    $rootScope.$apply();
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    function() {
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
      fakeEditableCollectionBackendApiService.failure = 'Internal 500 error';

      CollectionEditorStateService.loadCollection(5);
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(true);

      $rootScope.$apply();
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
    }
  );

  it('should report that a collection has loaded through loadCollection()',
    function() {
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      CollectionEditorStateService.loadCollection(5);
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      $rootScope.$apply();
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
    }
  );

  it('should report that a collection has loaded through setCollection()',
    function() {
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      var newCollection = Collection.create(
        secondBackendCollectionObject);
      CollectionEditorStateService.setCollection(newCollection);
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
    }
  );

  it('should initially return an empty collection', function() {
    var collection = CollectionEditorStateService.getCollection();
    expect(collection.getId()).toBeNull();
    expect(collection.getTitle()).toBeNull();
    expect(collection.getObjective()).toBeNull();
    expect(collection.getCategory()).toBeNull();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should initially return an empty collection rights', function() {
    var collectionRights = CollectionEditorStateService.getCollectionRights();
    expect(collectionRights.getCollectionId()).toBeNull();
    expect(collectionRights.canEdit()).toBeNull();
    expect(collectionRights.canUnpublish()).toBeNull();
    expect(collectionRights.isPrivate()).toBeNull();
    expect(collectionRights.getOwnerNames()).toEqual([]);
  });

  it('should return the last collection loaded as the same object', function() {
    var previousCollection = CollectionEditorStateService.getCollection();
    var expectedCollection = Collection.create(
      fakeEditableCollectionBackendApiService.newBackendCollectionObject);
    expect(previousCollection).not.toEqual(expectedCollection);

    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    var actualCollection = CollectionEditorStateService.getCollection();
    expect(actualCollection).toEqual(expectedCollection);

    // Although the actual collection equals the expected collection, they are
    // different objects. Ensure that the actual collection is still the same
    // object from before loading it, however.
    expect(actualCollection).toBe(previousCollection);
    expect(actualCollection).not.toBe(expectedCollection);
  });

  it('should return the last collection rights loaded as the same object',
    function() {
      var previousCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      var expectedCollectionRights = CollectionRights.create(
        fakeCollectionRightsBackendApiService.backendCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      var actualCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      expect(actualCollectionRights).toEqual(expectedCollectionRights);

      // Although the actual collection rights equals the expected collection
      // rights, they are different objects. Ensure that the actual collection
      // rights is still the same object from before loading it, however.
      expect(actualCollectionRights).toBe(previousCollectionRights);
      expect(actualCollectionRights).not.toBe(expectedCollectionRights);
    }
  );

  it('should be able to set a new collection with an in-place copy',
    function() {
      var previousCollection = CollectionEditorStateService.getCollection();
      var expectedCollection = Collection.create(
        secondBackendCollectionObject);
      expect(previousCollection).not.toEqual(expectedCollection);

      CollectionEditorStateService.setCollection(expectedCollection);

      var actualCollection = CollectionEditorStateService.getCollection();
      expect(actualCollection).toEqual(expectedCollection);

      // Although the actual collection equals the expected collection, they are
      // different objects. Ensure that the actual collection is still the same
      // object from before loading it, however.
      expect(actualCollection).toBe(previousCollection);
      expect(actualCollection).not.toBe(expectedCollection);
    }
  );

  it('should be able to set a new collection rights with an in-place copy',
    function() {
      var previousCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      var expectedCollectionRights = CollectionRights.create(
        unpublishablePublicCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      CollectionEditorStateService.setCollectionRights(
        expectedCollectionRights);

      var actualCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      expect(actualCollectionRights).toEqual(expectedCollectionRights);

      // Although the actual collection rights equals the expected collection
      // rights, they are different objects. Ensure that the actual collection
      // rights is still the same object from before loading it, however.
      expect(actualCollectionRights).toBe(previousCollectionRights);
      expect(actualCollectionRights).not.toBe(expectedCollectionRights);
    }
  );

  it('should fire an update event after setting the new collection',
    function() {
      // Load initial collection.
      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      var newCollection = Collection.create(
        secondBackendCollectionObject);
      CollectionEditorStateService.setCollection(newCollection);

      expect(collectionInitializedSpy).toHaveBeenCalled();
    }
  );

  it('should fail to save the collection without first loading one',
    function() {
      expect(function() {
        CollectionEditorStateService.saveCollection('Commit message');
      }).toThrowError('Cannot save a collection before one is loaded.');
    }
  );

  it('should not save the collection if there are no pending changes',
    function() {
      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      expect(CollectionEditorStateService.saveCollection(
        'Commit message')).toBe(false);
    }
  );

  it('should be able to save the collection and pending changes', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'updateCollectionAsync').and.callThrough();

    CollectionEditorStateService.loadCollection(0);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    expect(CollectionEditorStateService.saveCollection(
      'Commit message')).toBe(true);
    $rootScope.$apply();

    var expectedId = '0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateCollectionSpy = (
      fakeEditableCollectionBackendApiService.updateCollectionAsync);
    expect(updateCollectionSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the collection', function() {
    CollectionEditorStateService.loadCollection(5);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    CollectionEditorStateService.saveCollection('Commit message');
    $rootScope.$apply();

    expect(collectionInitializedSpy).toHaveBeenCalled();
  });

  it('should track whether it is currently saving the collection', function() {
    CollectionEditorStateService.loadCollection(5);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
    CollectionEditorStateService.saveCollection('Commit message');
    expect(CollectionEditorStateService.isSavingCollection()).toBe(true);

    $rootScope.$apply();
    expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
  });

  it('should indicate a collection is no longer saving after an error',
    function() {
      CollectionEditorStateService.loadCollection(5);
      CollectionUpdateService.setCollectionTitle(
        CollectionEditorStateService.getCollection(), 'New title');
      $rootScope.$apply();

      expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
      fakeEditableCollectionBackendApiService.failure = 'Internal 500 error';

      CollectionEditorStateService.saveCollection('Commit message');
      expect(CollectionEditorStateService.isSavingCollection()).toBe(true);

      $rootScope.$apply();
      expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
    }
  );
});
