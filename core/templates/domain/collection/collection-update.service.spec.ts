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
 * @fileoverview Tests for Collection update service.
 */

import { TestBed } from '@angular/core/testing';

import { Collection, CollectionBackendDict } from
  'domain/collection/collection.model';
import { CollectionUpdateService } from
  'domain/collection/collection-update.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';

describe('Collection update service', () => {
  let collectionUpdateService: CollectionUpdateService = null;
  let undoRedoService: UndoRedoService = null;
  let _sampleCollection = null;
  let _sampleExplorationSummaryBackendObject = {
    title: 'Title',
    status: 'public'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: []
    });
    collectionUpdateService = TestBed.get(CollectionUpdateService);
    undoRedoService = TestBed.get(UndoRedoService);
  });

  beforeEach(() => {
    const sampleCollectionBackendObject = {
      id: 'collection_id',
      title: 'a title',
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: '1',
      nodes: [{
        exploration_id: 'exp_id0',
        exploration: {}
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };
    _sampleCollection = Collection.create(
      // TODO(#10875): Fix type mismatch.
      sampleCollectionBackendObject as unknown as CollectionBackendDict);
  });

  it('should add/remove a new collection node to/from a collection',
    () => {
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
      collectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(_sampleCollection.getExplorationIds()).toEqual([
        'exp_id0', 'exp_id1'
      ]);

      undoRedoService.undoChange(_sampleCollection);
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    }
  );

  it('should create a proper backend change dict for adding collection nodes',
    () => {
      collectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_collection_node',
        exploration_id: 'exp_id1'
      }]);
    }
  );

  it('should remove/add a collection node from/to a collection', function() {
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    collectionUpdateService.deleteCollectionNode(_sampleCollection, 'exp_id0');
    expect(_sampleCollection.getExplorationIds()).toEqual([]);

    undoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
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

  it('should set/unset changes to a collection\'s title', function() {
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
