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
 * @fileoverview Unit tests for CollectionSummary.
 */

import { CollectionSummary } from 'domain/collection/collection-summary.model';

describe('Collection summary model', () => {
  it('should correctly convert dict to collection summary object', () => {
    let backendDict = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      language_code: 'en',
      thumbnail_bg_color: '#cc4b00',
      created_on: 1591296635736.666,
      status: 'public',
      category: 'Algebra',
      title: 'Test Title',
      node_count: 0
    };

    let collectionSummaryObject = CollectionSummary.createFromBackendDict(
      backendDict);

    expect(collectionSummaryObject.lastUpdatedMsec).toEqual(1591296737470.528);
    expect(collectionSummaryObject.communityOwned).toEqual(false);
    expect(collectionSummaryObject.objective).toEqual('Test Objective');
    expect(collectionSummaryObject.id).toEqual('44LKoKLlIbGe');
    expect(collectionSummaryObject.thumbnailIconUrl).toEqual(
      '/subjects/Algebra.svg');
    expect(collectionSummaryObject.languageCode).toEqual('en');
    expect(collectionSummaryObject.thumbnailBgColor).toEqual('#cc4b00');
    expect(collectionSummaryObject.createdOn).toEqual(1591296635736.666);
    expect(collectionSummaryObject.status).toEqual('public');
    expect(collectionSummaryObject.category).toEqual('Algebra');
    expect(collectionSummaryObject.title).toEqual('Test Title');
    expect(collectionSummaryObject.nodeCount).toEqual(0);
  });
});
