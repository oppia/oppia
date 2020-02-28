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

import { TestBed } from '@angular/core/testing';

import { CollectionNodeObjectFactory } from
  'domain/collection/CollectionNodeObjectFactory';
import { Collection, CollectionObjectFactory } from
  'domain/collection/CollectionObjectFactory';
import { GuestCollectionProgressService } from
  'domain/collection/guest-collection-progress.service';

describe('Guest collection progress service', () => {
  let guestCollectionProgressService = null;
  let collectionObjectFactory: CollectionObjectFactory = null;
  let collectionNodeObjectFactory: CollectionNodeObjectFactory = null;
  let _collectionId0: string = null;
  let _collectionId1: string = null;
  let _expId0: string = null;
  let _expTitle0: string = null;
  let _expId1: string = null;
  let _expTitle1: string = null;
  let _expId2: string = null;
  let _expTitle2: string = null;
  let _collection0: Collection = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuestCollectionProgressService]
    });

    guestCollectionProgressService = TestBed.get(
      GuestCollectionProgressService);
    collectionObjectFactory = TestBed.get(CollectionObjectFactory);
    collectionNodeObjectFactory = TestBed.get(CollectionNodeObjectFactory);

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
      collectionNodeObjectFactory.createFromExplorationId(_expId0));
  });

  afterEach(() => {
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
    return collectionObjectFactory.create(collectionBackendObject);
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
    return collectionNodeObjectFactory.create(collectionNodeBackendObject);
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

  describe('hasCompletedSomeExploration', () => {
    it('should initially not have any stored progress', () => {
      var hasProgress = (
        guestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(false);
    });

    it('should have progress after recording an exploration', () => {
      guestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var hasProgress = (
        guestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(true);
    });

    it('should not have progress after exp completed for another collection',
      () => {
        guestCollectionProgressService.recordExplorationCompletedInCollection(
          _collectionId1, _expId0);
        var hasProgress = (
          guestCollectionProgressService.hasCompletedSomeExploration(
            _collectionId0));
        expect(hasProgress).toBe(false);
      }
    );
  });

  describe('getCompletedExplorationIds', () => {
    it('should initially provide no completed exploration ids', () => {
      var completedIds = (
        guestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide completed exploration ID after completion', () => {
      guestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var completedIds = (
        guestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([_expId0]);
    });

    it('should not provide completed ID for exp not in collection', () => {
      guestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId1);
      var completedIds = (
        guestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide multiple completed exploration IDs', () => {
      var collection = _createLinearCollection(_collectionId1);
      guestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId0);
      guestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId2);
      var completedIds = (
        guestCollectionProgressService.getCompletedExplorationIds(collection));
      expect(completedIds).toEqual([_expId0, _expId2]);
    });
  });

  describe('getNextExplorationId', () => {
    it('should provide the first exploration ID with no progress', () => {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        guestCollectionProgressService.getNextExplorationId(collection, []));
      expect(nextExplorationId).toEqual(_expId0);
    });

    it('should provide the third exp ID with first two exps done', () => {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        guestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1]));

      // First two explorations are completed, so return the third.
      expect(nextExplorationId).toEqual(_expId2);
    });

    it('should return null for fully completed collection', () => {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        guestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1, _expId2]));

      // There are no explorations left to play.
      expect(nextExplorationId).toEqual(null);
    });
  });
});
