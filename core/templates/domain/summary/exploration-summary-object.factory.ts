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
 * @fileoverview Frontend domain object factory for exploration summary.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

interface ExpRatings {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

export interface ExplorationSummaryBackendDict {
  'category'?: string;
  'community_owned'?: boolean;
  'activity_type'?: string;
  'last_updated_msec'?: number;
  'ratings'?: ExpRatings;
  'id'?: string;
  'created_on_msec'?: number;
  'human_readable_contributors_summary'?: Object;
  'language_code'?: string;
  'num_views'?: number;
  'objective'?: string;
  'status'?: string;
  'tags'?: string[];
  'thumbnail_bg_color'?: string;
  'thumbnail_icon_url'?: string;
  'title'?: string;
}

export class ExplorationSummary {
  category: string;
  communityOwned: boolean;
  activityType: string;
  lastUpdatedMsec: number;
  createdOnMsec: number;
  ratings: ExpRatings;
  id: string;
  humanReadableContributorsSummary: Object;
  languageCode: string;
  numViews: number;
  objective: string;
  status: string;
  tags: string[];
  thumbnailBgColor: string;
  thumbnailIconUrl: string;
  title: string;

  constructor(
      category: string, communityOwned: boolean, id: string,
      languageCode: string, numViews: number, objective: string,
      status: string, tags: string[], thumbnailBgColor: string,
      thumbnailIconUrl: string, title: string, activityType: string,
      lastUpdatedMsec: number, createdOnMsec: number, ratings: ExpRatings,
      humanReadableContributorsSummary: Object) {
    this.category = category;
    this.communityOwned = communityOwned;
    this.id = id;
    this.languageCode = languageCode;
    this.numViews = numViews;
    this.objective = objective;
    this.status = status;
    this.tags = tags;
    this.thumbnailBgColor = thumbnailBgColor;
    this.thumbnailIconUrl = thumbnailIconUrl;
    this.title = title;
    this.activityType = activityType;
    this.lastUpdatedMsec = lastUpdatedMsec;
    this.createdOnMsec = createdOnMsec;
    this.ratings = ratings;
    this.humanReadableContributorsSummary = humanReadableContributorsSummary;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationSummaryObjectFactory {
  createFromBackendDict(
      expSummaryBacknedDict: ExplorationSummaryBackendDict) {
    return new ExplorationSummary(
      expSummaryBacknedDict.category, expSummaryBacknedDict.community_owned,
      expSummaryBacknedDict.id, expSummaryBacknedDict.language_code,
      expSummaryBacknedDict.num_views, expSummaryBacknedDict.objective,
      expSummaryBacknedDict.status, expSummaryBacknedDict.tags,
      expSummaryBacknedDict.thumbnail_bg_color,
      expSummaryBacknedDict.thumbnail_icon_url, expSummaryBacknedDict.title,
      expSummaryBacknedDict.activity_type,
      expSummaryBacknedDict.last_updated_msec,
      expSummaryBacknedDict.created_on_msec, expSummaryBacknedDict.ratings,
      expSummaryBacknedDict.human_readable_contributors_summary);
  }
}

angular.module('oppia').factory(
  'ExplorationSummaryObjectFactory',
  downgradeInjectable(ExplorationSummaryObjectFactory));
