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
 * @fileoverview Tests for CollectionNodeObjectFactory.
 */

import { CollectionNodeObjectFactory } from
  'domain/collection/collection-node-object.factory';

describe('Collection node object factory', () => {
  var collectionNodeObjectFactory: CollectionNodeObjectFactory = null;

  beforeEach(() => {
    collectionNodeObjectFactory = new CollectionNodeObjectFactory();
  });

  it('should provide an immutable exploration summary', () => {
    var explorationSummaryBackendObject = {
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
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'exp title'
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

  it('should be able to create a new collection node by exploration ID',
    () => {
      var collectionNode = collectionNodeObjectFactory.createFromExplorationId(
        'exp_id0');
      expect(collectionNode.getExplorationId()).toEqual('exp_id0');
      expect(collectionNode.doesExplorationExist()).toBe(false);
    }
  );
});
