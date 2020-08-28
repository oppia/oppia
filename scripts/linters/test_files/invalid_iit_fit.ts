// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Invalid syntax .ts file, used by scripts/linters/
 * js_ts_linter_test.py. This file use iit and fit which is not allowed.
 */

import { CollectionNodeObjectFactory } from
  'domain/collection/CollectionNodeObjectFactory';

describe('Collection node object factory', () => {
  var collectionNodeObjectFactory: CollectionNodeObjectFactory = null;

  beforeEach(() => {
    collectionNodeObjectFactory = new CollectionNodeObjectFactory();
  });

  var _createEmptyCollectionNode = function(explorationId) {
    return collectionNodeObjectFactory.create({
      exploration_id: explorationId,
      exploration_summary: {
        title: 'Title',
        status: 'private'
      }
    });
  };
// iit is not allowed to use.
  iit('should provide an immutable exploration summary', () => {
    var explorationSummaryBackendObject = {
      title: 'exp title',
      category: 'exp category',
      objective: 'exp objective'
    };
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: explorationSummaryBackendObject
    };

    var collectionNode = collectionNodeObjectFactory.create(
      collectionNodeBackendObject);
    expect(collectionNode.getExplorationId()).toEqual('exp_id0');
    expect(collectionNode.getExplorationTitle()).toEqual('exp title');

    var summaryObject = collectionNode.getExplorationSummaryObject();
    expect(summaryObject).toEqual(explorationSummaryBackendObject);

    delete summaryObject.category;
    expect(summaryObject).not.toEqual(
      collectionNode.getExplorationSummaryObject());
  });
// fit is not allowed to use.
  fit('should be able to create a new collection node by exploration ID',
    () => {
      var collectionNode = collectionNodeObjectFactory.createFromExplorationId(
        'exp_id0');
      expect(collectionNode.getExplorationId()).toEqual('exp_id0');
      expect(collectionNode.doesExplorationExist()).toBe(false);
    }
  );
});
