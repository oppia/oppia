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

describe('Collection editor state service', function() {
  var CollectionEditorStateService = null;
  var CollectionObjectFactory = null;
  var CollectionUpdateService = null;
  var fakeEditableCollectionBackendApiService = null;

  // TODO(bhenning): Consider moving this to a more shareable location.
  var FakeEditableCollectionBackendApiService = function() {
    var self = {};

    var _fetchOrUpdateCollection = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendCollectionObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendCollectionObject = {};
    self.failure = null;
    self.fetchCollection = _fetchOrUpdateCollection;
    self.updateCollection = _fetchOrUpdateCollection;

    return self;
  };

  beforeEach(module('oppia'));
  beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(module('oppia', function($provide) {
    fakeEditableCollectionBackendApiService = (
      new FakeEditableCollectionBackendApiService());
    $provide.value(
      'EditableCollectionBackendApiService',
      fakeEditableCollectionBackendApiService);
  }));

  beforeEach(inject(function($injector) {
    CollectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionUpdateService = $injector.get('CollectionUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    fakeEditableCollectionBackendApiService.newBackendCollectionObject = {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      schema_version: '1',
      version: '1',
      nodes: [{
        exploration_id: '0',
        prerequisite_skills: [],
        acquired_skills: ['skill2']
      }, {
        exploration_id: '1',
        prerequisite_skills: ['skill2'],
        acquired_skills: ['skill1']
      }]
    };
    secondBackendCollectionObject = {
      id: '5',
      title: 'Interesting collection',
      category: 'Test',
      objective: 'To be interesting',
      language_code: 'en',
      tags: [],
      schema_version: '2',
      version: '3',
      nodes: [{
        exploration_id: '0',
        prerequisite_skills: [],
        acquired_skills: ['interest']
      }]
    };
  }));

  it('should request to load the collection from the backend', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'fetchCollection').andCallThrough();

    CollectionEditorStateService.loadCollection(5);
    expect(fakeEditableCollectionBackendApiService.fetchCollection)
      .toHaveBeenCalled();
  });

  it('should fire an init event after loading the first collection',
      function() {
    spyOn($rootScope, '$broadcast').andCallThrough();

    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionInitialized');
  });

  it('should fire an update event after loading more collections', function() {
    // Load initial collection.
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').andCallThrough();

    // Load a second collection.
    CollectionEditorStateService.loadCollection(1);
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionReinitialized');
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
  });

  it('it should report that a collection has loaded through loadCollection()',
      function() {
    expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

    CollectionEditorStateService.loadCollection(5);
    expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

    $rootScope.$apply();
    expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
  });

  it('it should report that a collection has loaded through setCollection()',
      function() {
    expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

    var newCollection = CollectionObjectFactory.create(
      secondBackendCollectionObject);
    CollectionEditorStateService.setCollection(newCollection);
    expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
  });

  it('should initially return an empty collection', function() {
    var collection = CollectionEditorStateService.getCollection();
    expect(collection.getId()).toBeUndefined();
    expect(collection.getTitle()).toBeUndefined();
    expect(collection.getObjective()).toBeUndefined();
    expect(collection.getCategory()).toBeUndefined();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should return the last collection loaded as the same object', function() {
    var previousCollection = CollectionEditorStateService.getCollection();
    var expectedCollection = CollectionObjectFactory.create(
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

  it('should be able to set a new collection with an in-place copy',
      function() {
    var previousCollection = CollectionEditorStateService.getCollection();
    var expectedCollection = CollectionObjectFactory.create(
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
  });

  it('should fire an update event after setting the new collection',
      function() {
    // Load initial collection.
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').andCallThrough();

    var newCollection = CollectionObjectFactory.create(
      secondBackendCollectionObject);
    CollectionEditorStateService.setCollection(newCollection);

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionReinitialized');
  });

  it('should fail to save the collection without first loading one',
      function() {
    expect(function() {
      CollectionEditorStateService.saveCollection('Commit message');
    }).toThrow();
  });

  it('should not save the collection if there are no pending changes',
      function() {
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').andCallThrough();
    expect(CollectionEditorStateService.saveCollection(
      'Commit message')).toBe(false);
    expect($rootScope.$broadcast).not.toHaveBeenCalled();
  });

  it('should be able to save the collection and pending changes', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'updateCollection').andCallThrough();

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
      fakeEditableCollectionBackendApiService.updateCollection);
    expect(updateCollectionSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the collection', function() {
    CollectionEditorStateService.loadCollection(5);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').andCallThrough();
    CollectionEditorStateService.saveCollection('Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionReinitialized');
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
  });

  it('should initially return an empty skill list', function() {
    var collectionSkillList = (
      CollectionEditorStateService.getCollectionSkillList());
    expect(collectionSkillList.getSkills()).toEqual([]);
  });

  it('should return an aggregate of the collection\'s skill lists', function() {
    var prevCollectionSkillList = (
      CollectionEditorStateService.getCollectionSkillList());
    expect(prevCollectionSkillList.getSkills()).toEqual([]);

    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    var collectionSkillList = (
      CollectionEditorStateService.getCollectionSkillList());
    expect(collectionSkillList.getSkills()).toEqual(['skill1', 'skill2']);
    expect(collectionSkillList).toBe(prevCollectionSkillList);
  });

  it('should update the collection\'s skill list with UndoRedoService changes',
      function() {
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    var prevCollectionSkillList = (
      CollectionEditorStateService.getCollectionSkillList());
    expect(prevCollectionSkillList.getSkills()).toEqual(['skill1', 'skill2']);

    // Simply applying a change is adequate for updating the skill list.
    var collection = CollectionEditorStateService.getCollection();
    CollectionUpdateService.setAcquiredSkills(
      collection, '0', ['skill2', 'skill3']);
    $rootScope.$apply();

    var collectionSkillList = (
      CollectionEditorStateService.getCollectionSkillList());
    expect(collectionSkillList.getSkills()).toEqual([
      'skill1', 'skill2', 'skill3']);
    expect(collectionSkillList).toBe(prevCollectionSkillList);
  });
});
