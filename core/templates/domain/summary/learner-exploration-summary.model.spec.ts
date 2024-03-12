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
 * @fileoverview Unit tests for ExplorationSummaryModel.
 */

import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';

describe('Exploration summary model', () => {
  it('should correctly convert backend dict to exp summary object', () => {
    let backendDict = {
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
        5: 0,
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title',
    };

    let expSummaryObject =
      LearnerExplorationSummary.createFromBackendDict(backendDict);

    expect(expSummaryObject.lastUpdatedMsec).toEqual(1591296737470.528);
    expect(expSummaryObject.communityOwned).toEqual(false);
    expect(expSummaryObject.objective).toEqual('Test Objective');
    expect(expSummaryObject.id).toEqual('44LKoKLlIbGe');
    expect(expSummaryObject.numViews).toEqual(0);
    expect(expSummaryObject.thumbnailIconUrl).toEqual('/subjects/Algebra.svg');
    expect(expSummaryObject.humanReadableContributorsSummary).toEqual({});
    expect(expSummaryObject.languageCode).toEqual('en');
    expect(expSummaryObject.thumbnailBgColor).toEqual('#cc4b00');
    expect(expSummaryObject.createdOnMsec).toEqual(1591296635736.666);
    expect(expSummaryObject.ratings).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });
    expect(expSummaryObject.status).toEqual('public');
    expect(expSummaryObject.tags).toEqual([]);
    expect(expSummaryObject.activityType).toEqual('exploration');
    expect(expSummaryObject.category).toEqual('Algebra');
    expect(expSummaryObject.title).toEqual('Test Title');
  });
});
