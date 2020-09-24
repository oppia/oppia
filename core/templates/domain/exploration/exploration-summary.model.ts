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
 * @fileoverview Frontend domain model for exploration summary.
 */

export interface ExplorationSummaryBackendDict {
  'category': string;
  'community_owned': boolean;
  'last_updated_msec': number;
  'id': string;
  'created_on': number;
  'language_code': string;
  'objective': string;
  'status': string;
  'thumbnail_bg_color': string;
  'thumbnail_icon_url': string;
  'title': string;
  'node_count': number;
  'tags': any;
  /*
  'owner_ids': ;
  'editor_ids': ;
  'viewer_ids': ;
  'contributor_ids': ;
  'contributors_summary': ;
  'version': ;
  'collection_model_created_on': ;
  'collection_model_last_updated': ; */
}

export class ExplorationSummary {
  constructor(
    public category: string,
    public communityOwned: boolean,
    public lastUpdatedMsec: number,
    public id: string,
    public createdOn: number,
    public languageCode: string,
    public objective: string,
    public status: string,
    public thumbnailBgColor: string,
    public thumbnailIconUrl: string,
    public title: string,
    public nodeCount: number,
    public tags: any) {}

  static createFromBackendDict(
      explorationSummaryDict: ExplorationSummaryBackendDict):
      ExplorationSummary {
    return new ExplorationSummary(
      explorationSummaryDict.category,
      explorationSummaryDict.community_owned,
      explorationSummaryDict.last_updated_msec,
      explorationSummaryDict.id,
      explorationSummaryDict.created_on,
      explorationSummaryDict.language_code,
      explorationSummaryDict.objective,
      explorationSummaryDict.status,
      explorationSummaryDict.thumbnail_bg_color,
      explorationSummaryDict.thumbnail_icon_url,
      explorationSummaryDict.title,
      explorationSummaryDict.node_count,
      explorationSummaryDict.tags
      );
  }
}
