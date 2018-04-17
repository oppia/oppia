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
 * @fileoverview Tests for ChangeObjectFactory.
 */

describe('Collection update service', function() {
  var CollectionUpdateService = null;
  var CollectionObjectFactory = null;
  var UndoRedoService = null;
  var _sampleCollection = null;
  var _sampleExplorationSummaryBackendObject = {
    title: 'Title',
    status: 'public'
  };

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionUpdateService = $injector.get('CollectionUpdateService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var sampleCollectionBackendObject = {
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
      }]
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
  }));

  var _getCollectionNode = function(expId) {
    return _sampleCollection.getCollectionNodeByExplorationId(expId);
  };

  it('should add/remove a new collection node to/from a collection',
    function() {
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
      CollectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(_sampleCollection.getExplorationIds()).toEqual([
        'exp_id0', 'exp_id1'
      ]);

      UndoRedoService.undoChange(_sampleCollection);
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    }
  );

  it('should create a proper backend change dict for adding collection nodes',
    function() {
      CollectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_collection_node',
        exploration_id: 'exp_id1'
      }]);
    }
  );

  it('should remove/add a collection node from/to a collection', function() {
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    CollectionUpdateService.deleteCollectionNode(_sampleCollection, 'exp_id0');
    expect(_sampleCollection.getExplorationIds()).toEqual([]);

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
  });

  it('should create a proper backend change dict for deleting collection nodes',
    function() {
      CollectionUpdateService
        .deleteCollectionNode(_sampleCollection, 'exp_id0');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_collection_node',
        exploration_id: 'exp_id0'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s title', function() {
    expect(_sampleCollection.getTitle()).toEqual('a title');
    CollectionUpdateService.setCollectionTitle(_sampleCollection, 'new title');
    expect(_sampleCollection.getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTitle()).toEqual('a title');
  });

  it('should create a proper backend change dict for changing titles',
    function() {
      CollectionUpdateService
        .setCollectionTitle(_sampleCollection, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'a title'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s category', function() {
    expect(_sampleCollection.getCategory()).toEqual('a category');
    CollectionUpdateService.setCollectionCategory(
      _sampleCollection, 'new category');
    expect(_sampleCollection.getCategory()).toEqual('new category');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getCategory()).toEqual('a category');
  });

  it('should create a proper backend change dict for changing categories',
    function() {
      CollectionUpdateService.setCollectionCategory(
        _sampleCollection, 'new category');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'category',
        new_value: 'new category',
        old_value: 'a category'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s objective', function() {
    expect(_sampleCollection.getObjective()).toEqual('an objective');
    CollectionUpdateService.setCollectionObjective(
      _sampleCollection, 'new objective');
    expect(_sampleCollection.getObjective()).toEqual('new objective');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getObjective()).toEqual('an objective');
  });

  it('should create a proper backend change dict for changing objectives',
    function() {
      CollectionUpdateService.setCollectionObjective(
        _sampleCollection, 'new objective');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'objective',
        new_value: 'new objective',
        old_value: 'an objective'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s language code', function() {
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
    CollectionUpdateService.setCollectionLanguageCode(_sampleCollection, 'fi');
    expect(_sampleCollection.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      CollectionUpdateService
        .setCollectionLanguageCode(_sampleCollection, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s tags', function() {
    expect(_sampleCollection.getTags()).toEqual([]);
    CollectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
    expect(_sampleCollection.getTags()).toEqual(['test']);

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTags()).toEqual([]);
  });

  it('should create a proper backend change dict for changing tags',
    function() {
      CollectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'tags',
        new_value: ['test'],
        old_value: []
      }]);
    });
});
