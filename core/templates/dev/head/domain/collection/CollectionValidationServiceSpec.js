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
 * @fileoverview Tests for CollectionValidationService.
 */

describe('Collection validation service', function() {
  var CollectionValidationService = null;
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;

  var EXISTS = true;
  var DOES_NOT_EXIST = false;
  var PUBLIC_STATUS = true;
  var PRIVATE_STATUS = false;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionValidationService = $injector.get('CollectionValidationService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');

    var sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: []
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
    _addCollectionNode('exp_id0', EXISTS, PRIVATE_STATUS);
  }));

  var _addCollectionNode = function(explorationId, exists, isPublic) {
    var collectionNode = CollectionNodeObjectFactory.createFromExplorationId(
      explorationId);
    if (exists) {
      collectionNode.setExplorationSummaryObject({
        status: isPublic ? 'public' : 'private'
      });
    }
    return _sampleCollection.addCollectionNode(collectionNode);
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  var _findPrivateValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPrivateCollection(
      _sampleCollection);
  };

  var _findPublicValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPublicCollection(
      _sampleCollection);
  };

  it('should not find issues with a collection with one node', function() {
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should expect at least one collection node', function() {
    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'There should be at least 1 exploration in the collection.']);
  });

  it('should detect nonexistent/inaccessible explorations', function() {
    expect(_addCollectionNode(
      'exp_id1', DOES_NOT_EXIST, PRIVATE_STATUS)).toBe(true);
    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) either do not exist, or you do not have ' +
      'edit access to add them to this collection: exp_id1'
    ]);
  });

  it('should allow private and public explorations in a private collection',
    function() {
      expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
      expect(_addCollectionNode('exp_id2', EXISTS, PUBLIC_STATUS)).toBe(true);
      var node0 = _getCollectionNode('exp_id0');
      var node1 = _getCollectionNode('exp_id1');
      var node2 = _getCollectionNode('exp_id2');

      var issues = _findPrivateValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should not allow private explorations in a public collection',
    function() {
      expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
      var node1 = _getCollectionNode('exp_id1');
      var node0 = _getCollectionNode('exp_id0');

      var issues = _findPublicValidationIssues();
      expect(issues).toEqual([
        'Private explorations cannot be added to a public collection: exp_id0'
      ]);

      expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
      issues = _findPublicValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should be able to detect multiple validation issues', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');

    var issues = _findPublicValidationIssues();
    expect(issues).toEqual([
      'Private explorations cannot be added to a public collection: ' +
      'exp_id0, exp_id2'
    ]);
  });

  it('should return false if the tags are not valid', function() {
    expect(CollectionValidationService.isTagValid(['test'])).toBe(true);
    expect(CollectionValidationService.isTagValid(['test', 'math'])).toBe(true);

    expect(CollectionValidationService.isTagValid(
      ['test', 'test'])).toBe(false);
    expect(CollectionValidationService.isTagValid(
      ['test '])).toBe(false);
  });
});
