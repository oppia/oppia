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
 * @fileoverview Unit tests for CreatorDashboardStats.
 */

import {CreatorDashboardStats} from 'domain/creator_dashboard/creator-dashboard-stats.model';

describe('Creator dashboard stats model', () => {
  it('should correctly convert backend dict to object', () => {
    let backendDict = {
      average_ratings: 1,
      num_ratings: 2,
      total_open_feedback: 3,
      total_plays: 4,
    };

    let dashboardStatsObject =
      CreatorDashboardStats.createFromBackendDict(backendDict);

    expect(dashboardStatsObject.averageRatings).toEqual(1);
    expect(dashboardStatsObject.numRatings).toEqual(2);
    expect(dashboardStatsObject.totalOpenFeedback).toEqual(3);
    expect(dashboardStatsObject.totalPlays).toEqual(4);
  });
});
