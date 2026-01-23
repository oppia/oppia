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
 * @fileoverview Frontend Model for learner exploration summary.
 */

import {HumanReadableContributorsSummary} from 'domain/summary/creator-exploration-summary.model';

export interface ExplorationRatings {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

export interface LearnerExplorationSummaryBackendDict {
  category: string;
  community_owned: boolean;
  activity_type: string;
  last_updated_msec: number;
  ratings: ExplorationRatings;
  id: string;
  created_on_msec: number;
  human_readable_contributors_summary: HumanReadableContributorsSummary;
  language_code: string;
  num_views: number;
  objective: string;
  status: string;
  tags: string[];
  thumbnail_bg_color: string;
  thumbnail_icon_url: string;
  title: string;
  total_cards_count?: number;
  visited_cards_count?: number;
  progress_percent?: number;
  most_recently_reached_checkpoint_state_name?: string | null;
  most_recently_reached_checkpoint_exp_version?: number | null;
  furthest_reached_checkpoint_state_name?: string | null;
  furthest_reached_checkpoint_exp_version?: number | null;
  checkpoint_progress_percentage?: number | null;
}

export class LearnerExplorationSummary {
  mostRecentlyReachedCheckpointStateName: string | null;
  mostRecentlyReachedCheckpointExpVersion: number | null;
  furthestReachedCheckpointStateName: string | null;
  furthestReachedCheckpointExpVersion: number | null;
  checkpointProgressPercentage: number | null;

  constructor(
    public category: string,
    public communityOwned: boolean,
    public id: string,
    public languageCode: string,
    public numViews: number,
    public objective: string,
    public status: string,
    public tags: string[],
    public thumbnailBgColor: string,
    public thumbnailIconUrl: string,
    public title: string,
    public activityType: string,
    public lastUpdatedMsec: number,
    public createdOnMsec: number,
    public ratings: ExplorationRatings,
    public humanReadableContributorsSummary: HumanReadableContributorsSummary,
    public totalCardsCount?: number,
    public visitedCardsCount?: number,
    public progressPercent?: number
  ) {
    // Initialize checkpoint fields to null by default; they are populated below
    // in createFromBackendDict when present on the payload.
    this.mostRecentlyReachedCheckpointStateName = null;
    this.mostRecentlyReachedCheckpointExpVersion = null;
    this.furthestReachedCheckpointStateName = null;
    this.furthestReachedCheckpointExpVersion = null;
    this.checkpointProgressPercentage = null;
  }

  static createFromBackendDict(
    expSummaryBacknedDict: LearnerExplorationSummaryBackendDict
  ): LearnerExplorationSummary {
    const summary = new LearnerExplorationSummary(
      expSummaryBacknedDict.category,
      expSummaryBacknedDict.community_owned,
      expSummaryBacknedDict.id,
      expSummaryBacknedDict.language_code,
      expSummaryBacknedDict.num_views,
      expSummaryBacknedDict.objective,
      expSummaryBacknedDict.status,
      expSummaryBacknedDict.tags,
      expSummaryBacknedDict.thumbnail_bg_color,
      expSummaryBacknedDict.thumbnail_icon_url,
      expSummaryBacknedDict.title,
      expSummaryBacknedDict.activity_type,
      expSummaryBacknedDict.last_updated_msec,
      expSummaryBacknedDict.created_on_msec,
      expSummaryBacknedDict.ratings,
      expSummaryBacknedDict.human_readable_contributors_summary,
      expSummaryBacknedDict.total_cards_count,
      expSummaryBacknedDict.visited_cards_count,
      expSummaryBacknedDict.progress_percent
    );

    summary.mostRecentlyReachedCheckpointStateName =
      expSummaryBacknedDict.most_recently_reached_checkpoint_state_name ?? null;
    summary.mostRecentlyReachedCheckpointExpVersion =
      expSummaryBacknedDict.most_recently_reached_checkpoint_exp_version ?? null;
    summary.furthestReachedCheckpointStateName =
      expSummaryBacknedDict.furthest_reached_checkpoint_state_name ?? null;
    summary.furthestReachedCheckpointExpVersion =
      expSummaryBacknedDict.furthest_reached_checkpoint_exp_version ?? null;
    summary.checkpointProgressPercentage =
      expSummaryBacknedDict.checkpoint_progress_percentage ?? null;

    return summary;
  }
}
