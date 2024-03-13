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
 * @fileoverview Frontend model for collection summary.
 */

export interface CollectionSummaryBackendDict {
  category: string;
  community_owned: boolean;
  last_updated_msec: number;
  id: string;
  created_on: number;
  language_code: string;
  objective: string;
  status: string;
  thumbnail_bg_color: string;
  thumbnail_icon_url: string;
  title: string;
  node_count: number;
}

export class CollectionSummary {
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
    public nodeCount: number
  ) {}

  static createFromBackendDict(
    collectionSummaryDict: CollectionSummaryBackendDict
  ): CollectionSummary {
    return new CollectionSummary(
      collectionSummaryDict.category,
      collectionSummaryDict.community_owned,
      collectionSummaryDict.last_updated_msec,
      collectionSummaryDict.id,
      collectionSummaryDict.created_on,
      collectionSummaryDict.language_code,
      collectionSummaryDict.objective,
      collectionSummaryDict.status,
      collectionSummaryDict.thumbnail_bg_color,
      collectionSummaryDict.thumbnail_icon_url,
      collectionSummaryDict.title,
      collectionSummaryDict.node_count
    );
  }
}
