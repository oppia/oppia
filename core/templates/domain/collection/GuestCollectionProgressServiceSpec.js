// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for GuestCollectionProgressService.
 */

describe('Guest collection progress service', function() {
  var GuestCollectionProgressService = null;
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    GuestCollectionProgressService = $injector.get(
      'GuestCollectionProgressService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');

    _collectionId0 = 'sample_collection_id0';
    _collectionId1 = 'sample_collection_id1';
    _expId0 = 'exp_id0';
    _expTitle0 = 'Exp 0';
    _expId1 = 'exp_id1';
    _expTitle1 = 'Exp 1';
    _expId2 = 'exp_id2';
    _expTitle2 = 'Exp 2';
    _collection0 = _createCollection(_collectionId0, 'a title');
    _collection0.addCollectionNode(
      CollectionNodeObjectFactory.createFromExplorationId(_expId0));
  }));

  afterEach(function() {
    // Reset localStorage to ensure state is not shared between the tests.
    window.localStorage.clear();
  });

  var _createCollection = function(collectionId, title) {
    var collectionBackendObject = {
      id: collectionId,
      title: title,
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: []
    };
    return CollectionObjectFactory.create(collectionBackendObject);
  };

  var _createCollectionNode = function(expId, expTitle) {
    var collectionNodeBackendObject = {
      exploration_id: expId,
      exploration_summary: {
        title: expTitle,
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    return CollectionNodeObjectFactory.create(collectionNodeBackendObject);
  };


  // TODO(bhenning): Find a way to de-duplicate & share this with
  // CollectionLinearizerServiceSpec.
  // The linear order of explorations is: exp_id0 -> exp_id1 -> exp_id2
  var _createLinearCollection = function(collectionId) {
    var collection = _createCollection(collectionId, 'Collection title');

    var collectionNode0 = _createCollectionNode(_expId0, _expTitle0);
    var collectionNode1 = _createCollectionNode(_expId1, _expTitle1);
    var collectionNode2 = _createCollectionNode(_expId2, _expTitle2);

    collection.addCollectionNode(collectionNode0);
    collection.addCollectionNode(collectionNode1);
    collection.addCollectionNode(collectionNode2);
    return collection;
  };

  describe('hasCompletedSomeExploration', function() {
    it('should initially not have any stored progress', function() {
      var hasProgress = (
        GuestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(false);
    });

    it('should have progress after recording an exploration', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var hasProgress = (
        GuestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(true);
    });

    it('should not have progress after exp completed for another collection',
      function() {
        GuestCollectionProgressService.recordExplorationCompletedInCollection(
          _collectionId1, _expId0);
        var hasProgress = (
          GuestCollectionProgressService.hasCompletedSomeExploration(
            _collectionId0));
        expect(hasProgress).toBe(false);
      }
    );
  });

  describe('getCompletedExplorationIds', function() {
    it('should initially provide no completed exploration ids', function() {
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide completed exploration ID after completion', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([_expId0]);
    });

    it('should not provide completed ID for exp not in collection', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId1);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide multiple completed exploration IDs', function() {
      var collection = _createLinearCollection(_collectionId1);
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId0);
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId2);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(collection));
      expect(completedIds).toEqual([_expId0, _expId2]);
    });
  });

  describe('getNextExplorationId', function() {
    it('should provide the first exploration ID with no progress', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(collection, []));
      expect(nextExplorationId).toEqual(_expId0);
    });

    it('should provide the third exp ID with first two exps done', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1]));

      // First two explorations are completed, so return the third.
      expect(nextExplorationId).toEqual(_expId2);
    });

    it('should return null for fully completed collection', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1, _expId2]));

      // There are no explorations left to play.
      expect(nextExplorationId).toEqual(null);
    });
  });
});
