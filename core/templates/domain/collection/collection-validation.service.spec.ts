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

import { TestBed } from '@angular/core/testing';

import { CollectionNode } from
  'domain/collection/collection-node.model';
import { CollectionBackendDict, Collection } from
  'domain/collection/collection.model';
import { CollectionValidationService } from
  'domain/collection/collection-validation.service';

describe('Collection validation service', function() {
  let collectionValidationService: CollectionValidationService = null;
  let sampleCollectionBackendObject: CollectionBackendDict = null;
  let _sampleCollection: Collection = null;

  let EXISTS: boolean = true;
  let DOES_NOT_EXIST: boolean = false;
  let PUBLIC_STATUS: boolean = true;
  let PRIVATE_STATUS: boolean = false;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CollectionValidationService]
    });

    collectionValidationService = TestBed.get(CollectionValidationService);

    sampleCollectionBackendObject = {
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
    _sampleCollection = Collection.create(
      sampleCollectionBackendObject);
    _addCollectionNode('exp_id0', EXISTS, PRIVATE_STATUS);
  });

  var _addCollectionNode = (explorationId, exists, isPublic) => {
    var collectionNode = CollectionNode.createFromExplorationId(
      explorationId);
    if (exists) {
      collectionNode.setExplorationSummaryObject({
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: isPublic ? 'public' : 'private',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      });
    }
    return _sampleCollection.addCollectionNode(collectionNode);
  };

  var _getCollectionNode = (explorationId) => {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  var _findPrivateValidationIssues = () => {
    return collectionValidationService.findValidationIssuesForPrivateCollection(
      _sampleCollection);
  };

  var _findPublicValidationIssues = () => {
    return collectionValidationService.findValidationIssuesForPublicCollection(
      _sampleCollection);
  };

  it('should not find issues with a collection with one node', () => {
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should expect at least one collection node', () => {
    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'There should be at least 1 exploration in the collection.']);
  });

  it('should detect nonexistent/inaccessible explorations', () => {
    expect(_addCollectionNode(
      'exp_id1', DOES_NOT_EXIST, PRIVATE_STATUS)).toBe(true);
    _getCollectionNode('exp_id0');
    _getCollectionNode('exp_id1');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) either do not exist, or you do not have ' +
      'edit access to add them to this collection: exp_id1'
    ]);
  });

  it('should allow private and public explorations in a private collection',
    () => {
      expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
      expect(_addCollectionNode('exp_id2', EXISTS, PUBLIC_STATUS)).toBe(true);
      _getCollectionNode('exp_id0');
      _getCollectionNode('exp_id1');
      _getCollectionNode('exp_id2');

      var issues = _findPrivateValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should not allow private explorations in a public collection',
    () => {
      expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
      _getCollectionNode('exp_id1');
      _getCollectionNode('exp_id0');

      var issues = _findPublicValidationIssues();
      expect(issues).toEqual([
        'Private explorations cannot be added to a public collection: exp_id0'
      ]);

      expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
      issues = _findPublicValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should be able to detect multiple validation issues', () => {
    expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    _getCollectionNode('exp_id0');
    _getCollectionNode('exp_id1');
    _getCollectionNode('exp_id2');

    var issues = _findPublicValidationIssues();
    expect(issues).toEqual([
      'Private explorations cannot be added to a public collection: ' +
      'exp_id0, exp_id2'
    ]);
  });

  it('should return false if the tags are not valid', () => {
    expect(collectionValidationService.isTagValid(['test'])).toBe(true);
    expect(collectionValidationService.isTagValid(['test', 'math'])).toBe(true);

    expect(collectionValidationService.isTagValid(
      ['test', 'test'])).toBe(false);
    expect(collectionValidationService.isTagValid(
      ['test '])).toBe(false);
  });
});
