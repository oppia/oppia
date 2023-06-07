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
 * @fileoverview Tests for collection-node.model.
 */

import { CollectionNode, CollectionNodeBackendDict}
  from 'domain/collection/collection-node.model';
import { LearnerExplorationSummaryBackendDict } from
  'domain/summary/learner-exploration-summary.model';

describe('Collection node model', () => {
  it('should provide an immutable exploration summary', () => {
    let explorationSummaryBackendObject:
      LearnerExplorationSummaryBackendDict = {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
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
    let collectionNodeBackendObject:
      CollectionNodeBackendDict = {
        exploration_id: 'exp_id0',
        exploration_summary: explorationSummaryBackendObject
      };

    let collectionNode: CollectionNode = CollectionNode.create(
      collectionNodeBackendObject);
    expect(collectionNode.getExplorationId()).toEqual('exp_id0');
    expect(collectionNode.getExplorationTitle()).toEqual('exp title');

    let summaryObject: LearnerExplorationSummaryBackendDict | null =
      collectionNode.getExplorationSummaryObject();
    expect(summaryObject).toEqual(explorationSummaryBackendObject);
  });

  it('should be able to create a new collection node by exploration ID',
    () => {
      let collectionNode: CollectionNode =
        CollectionNode.createFromExplorationId('exp_id0');
      expect(collectionNode.getExplorationId()).toEqual('exp_id0');
      expect(collectionNode.doesExplorationExist()).toBe(false);
    }
  );

  it('should be able to detect if exploration is private',
    () => {
      let explorationSummaryBackendObject:
        LearnerExplorationSummaryBackendDict = {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          },
          status: 'private',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'exp title'
        };
      let collectionNodeBackendObject:
        CollectionNodeBackendDict = {
          exploration_id: 'exp_id0',
          exploration_summary: explorationSummaryBackendObject
        };

      let collectionNode: CollectionNode = CollectionNode.create(
        collectionNodeBackendObject);

      expect(collectionNode.isExplorationPrivate()).toBe(true);
    }
  );

  it('should be able to set exploration summary object',
    () => {
      let explorationSummaryBackendObject:
        LearnerExplorationSummaryBackendDict = {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
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
      let collectionNodeBackendObject:
        CollectionNodeBackendDict = {
          exploration_id: 'exp_id0',
          exploration_summary: null
        };

      let collectionNode: CollectionNode = CollectionNode.create(
        collectionNodeBackendObject);

      let summaryObject = collectionNode.getExplorationSummaryObject();

      expect(summaryObject).toBeNull();
      expect(collectionNode.getExplorationTitle()).toBeNull();
      expect(collectionNode.isExplorationPrivate()).toBeFalse();

      collectionNode.setExplorationSummaryObject(
        explorationSummaryBackendObject);
      summaryObject = collectionNode.getExplorationSummaryObject();

      expect(summaryObject).toEqual(explorationSummaryBackendObject);
      expect(collectionNode.getCapitalizedObjective()).toBe('Test Objective');
    });

  it('should return null when Exploration Summary Object is null',
    () => {
      let explorationSummaryBackendObject:
      LearnerExplorationSummaryBackendDict | null = null;
      let collectionNodeBackendObject:
      CollectionNodeBackendDict = {
        exploration_id: 'exp_id0',
        exploration_summary: null
      };

      let collectionNode: CollectionNode = CollectionNode.create(
        collectionNodeBackendObject);

      let summaryObject = collectionNode.getExplorationSummaryObject();

      expect(summaryObject).toBeNull();
      expect(collectionNode.getExplorationTitle()).toBeNull();
      expect(collectionNode.isExplorationPrivate()).toBeFalse();

      collectionNode.setExplorationSummaryObject(
        explorationSummaryBackendObject);
      summaryObject = collectionNode.getExplorationSummaryObject();

      expect(summaryObject).toEqual(explorationSummaryBackendObject);
      expect(collectionNode.getCapitalizedObjective()).toBeNull();
    });
});
