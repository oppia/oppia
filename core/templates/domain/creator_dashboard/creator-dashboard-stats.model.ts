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
 * @fileoverview Frontend model for creator dashboard stats.
 */

export interface CreatorDashboardStatsBackendDict {
  'average_ratings': number;
  'num_ratings': number;
  'total_open_feedback': number;
  'total_plays': number;
}

export class CreatorDashboardStats {
  constructor(
    public averageRatings: number,
    public numRatings: number,
    public totalOpenFeedback: number,
    public totalPlays: number) { }

  static createFromBackendDict(
      dashboardStatsBackendDict: CreatorDashboardStatsBackendDict):
      CreatorDashboardStats {
    return new CreatorDashboardStats(
      dashboardStatsBackendDict.average_ratings,
      dashboardStatsBackendDict.num_ratings,
      dashboardStatsBackendDict.total_open_feedback,
      dashboardStatsBackendDict.total_plays);
  }
}
