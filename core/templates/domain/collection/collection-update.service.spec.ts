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
 * @fileoverview Tests for Collection update service.
 */

import { TestBed } from '@angular/core/testing';

import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { BackendChangeObject, Change } from 'domain/editor/undo_redo/change.model';

describe('Collection update service', () => {
  let collectionUpdateService: CollectionUpdateService;
  let undoRedoService: UndoRedoService;
  let learnerExplorationSummaryBackendDict:
    LearnerExplorationSummaryBackendDict;
  let _sampleCollection: Collection;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: []
    });
    collectionUpdateService = TestBed.get(CollectionUpdateService);
    undoRedoService = TestBed.get(UndoRedoService);
  });

  beforeEach(() => {
    learnerExplorationSummaryBackendDict = {
      activity_type: 'exploration',
      category: 'a category',
      community_owned: false,
      created_on_msec: 1591296635736.666,
      id: 'collection_id',
      last_updated_msec: 1591296737470.528,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      human_readable_contributors_summary: {},
      language_code: 'en',
      num_views: 0,
      objective: 'Test Objective',
      status: 'public',
      tags: [],
      thumbnail_bg_color: '#cc4b00',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      title: 'a title'
    };
    let sampleCollectionBackendObject: CollectionBackendDict = {
      id: 'collection_id',
      title: 'a title',
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: 1,
      schema_version: 1,
      nodes: [{
        exploration_id: 'exp_id0',
        exploration_summary: learnerExplorationSummaryBackendDict
      },
      {
        exploration_id: 'exp_id1',
        exploration_summary: learnerExplorationSummaryBackendDict
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };
    _sampleCollection = Collection.create(
      sampleCollectionBackendObject);
  });

  it('should add/remove a new collection node to/from a collection',
    () => {
      expect(_sampleCollection.getExplorationIds())
        .toEqual(['exp_id0', 'exp_id1']);
      collectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id2', learnerExplorationSummaryBackendDict);
      expect(_sampleCollection.getExplorationIds()).toEqual([
        'exp_id0', 'exp_id1', 'exp_id2'
      ]);

      undoRedoService.undoChange(_sampleCollection);
      expect(_sampleCollection.getExplorationIds())
        .toEqual(['exp_id0', 'exp_id1']);
    }
  );

  it('should create a proper backend change dict for adding collection nodes',
    () => {
      collectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', learnerExplorationSummaryBackendDict);
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_collection_node',
        exploration_id: 'exp_id1'
      }]);
    }
  );

  it('should swap nodes of a collection given indices and return to ' +
    'original state when undo opertaion is performed', ()=> {
    let swapCollectionSpy = spyOn(
      _sampleCollection, 'swapCollectionNodes').and.callThrough();
    // Before swapping.
    expect(_sampleCollection.nodes[0].getExplorationId()).toBe('exp_id0');
    expect(_sampleCollection.nodes[1].getExplorationId()).toBe('exp_id1');

    collectionUpdateService.swapNodes(_sampleCollection, 0, 1);
    // After swapping.
    expect(_sampleCollection.nodes[0].getExplorationId()).toBe('exp_id1');
    expect(_sampleCollection.nodes[1].getExplorationId()).toBe('exp_id0');

    // Triggering undo operation.
    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.nodes[0].getExplorationId()).toBe('exp_id0');
    expect(_sampleCollection.nodes[1].getExplorationId()).toBe('exp_id1');
    expect(swapCollectionSpy).toHaveBeenCalled();
  });

  it('should return true when collection node is being added ' +
    'when calling \'isAddingCollectionNode\'', ()=> {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const backendChangeObject: BackendChangeObject = {
      cmd: 'add_collection_node',
      exploration_id: 'exp_id0'
    };

    const changeObject = new Change(
      backendChangeObject, applyFunc, reverseFunc);

    let result = collectionUpdateService.isAddingCollectionNode(changeObject);

    expect(result).toBe(true);
  });

  it('should return exploration id from change object when calling ' +
    '\'getExplorationIdFromChangeObject\'', ()=> {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const backendChangeObject: BackendChangeObject = {
      cmd: 'add_collection_node',
      exploration_id: 'exp_id0'
    };

    const changeObject = new Change(
      backendChangeObject, applyFunc, reverseFunc);

    let expId = (
      collectionUpdateService.getExplorationIdFromChangeObject(changeObject));

    expect(expId).toBe('exp_id0');
  });

  it('should remove/add a collection node from/to a collection', ()=> {
    expect(_sampleCollection.getExplorationIds())
      .toEqual(['exp_id0', 'exp_id1']);
    collectionUpdateService.deleteCollectionNode(_sampleCollection, 'exp_id0');
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id1']);

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getExplorationIds())
      .toEqual(['exp_id1', 'exp_id0']);
  });

  it('should create a proper backend change dict for deleting collection nodes',
    () => {
      collectionUpdateService
        .deleteCollectionNode(_sampleCollection, 'exp_id0');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_collection_node',
        exploration_id: 'exp_id0'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s title', () => {
    expect(_sampleCollection.getTitle()).toEqual('a title');
    collectionUpdateService.setCollectionTitle(_sampleCollection, 'new title');
    expect(_sampleCollection.getTitle()).toEqual('new title');

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTitle()).toEqual('a title');
  });

  it('should create a proper backend change dict for changing titles',
    () => {
      collectionUpdateService
        .setCollectionTitle(_sampleCollection, 'new title');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'a title'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s category', () => {
    expect(_sampleCollection.getCategory()).toEqual('a category');
    collectionUpdateService.setCollectionCategory(
      _sampleCollection, 'new category');
    expect(_sampleCollection.getCategory()).toEqual('new category');

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getCategory()).toEqual('a category');
  });

  it('should create a proper backend change dict for changing categories',
    () => {
      collectionUpdateService.setCollectionCategory(
        _sampleCollection, 'new category');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'category',
        new_value: 'new category',
        old_value: 'a category'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s objective', () => {
    expect(_sampleCollection.getObjective()).toEqual('an objective');
    collectionUpdateService.setCollectionObjective(
      _sampleCollection, 'new objective');
    expect(_sampleCollection.getObjective()).toEqual('new objective');

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getObjective()).toEqual('an objective');
  });

  it('should create a proper backend change dict for changing objectives',
    () => {
      collectionUpdateService.setCollectionObjective(
        _sampleCollection, 'new objective');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'objective',
        new_value: 'new objective',
        old_value: 'an objective'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s language code', () => {
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
    collectionUpdateService.setCollectionLanguageCode(_sampleCollection, 'fi');
    expect(_sampleCollection.getLanguageCode()).toEqual('fi');

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    () => {
      collectionUpdateService
        .setCollectionLanguageCode(_sampleCollection, 'fi');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s tags', () => {
    expect(_sampleCollection.getTags()).toEqual([]);
    collectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
    expect(_sampleCollection.getTags()).toEqual(['test']);

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTags()).toEqual([]);
  });

  it('should create a proper backend change dict for changing tags',
    () => {
      collectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'tags',
        new_value: ['test'],
        old_value: []
      }]);
    });
});
