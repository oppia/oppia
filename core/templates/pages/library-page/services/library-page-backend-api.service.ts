// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of learner dashboard from the
 * backend.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { CreatorExplorationSummaryBackendDict } from 'domain/summary/creator-exploration-summary.model';

interface LibraryGroupDataBackendDict {
  'activity_list': ActivityDict[];
  'header_i18n_id': string;
  'preferred_language_codes': string[];
}

export interface ActivityDict {
  'activity_type': string;
  'category': string;
  'community_owned': boolean;
  'id': string;
  'language_code': string;
  'num_views': number;
  'objective': string;
  'status': string;
  'tags': [];
  'thumbnail_bg_color': string;
  'thumbnail_icon_url': string;
  'title': string;
}
export interface SummaryDict {
  'activity_summary_dicts': ActivityDict[];
  'categories': [];
  'header_i18n_id': string;
  'has_full_results_page': boolean;
  'full_results_url': string;
  'protractor_id': string;
}

interface CreatorDashboardDataBackendDict {
  'explorations_list': CreatorExplorationSummaryBackendDict[];
  'collections_list': CollectionSummaryBackendDict[];
}

export interface LibraryIndexData {
   'activity_summary_dicts_by_category': SummaryDict[];
   'preferred_language_codes': string[];
 }

export interface CreatorDashboardData {
   'explorations_list': CreatorExplorationSummaryBackendDict[];
   'collections_list': CollectionSummaryBackendDict[];
 }

export interface LibraryGroupData {
   'activity_list': ActivityDict[];
   'header_i18n_id': string;
   'preferred_language_codes': string[];
 }

@Injectable({
  providedIn: 'root'
})
export class LibraryPageBackendApiService {
  LIBRARY_INDEX_HANDLER: string = '/libraryindexhandler';
  CREATOR_DASHBOARD_HANDLER: string = '/creatordashboardhandler/data';
  LIBRARY_GROUP_HANDLER: string = '/librarygrouphandler';

  constructor(
     private http: HttpClient,
  ) {}

  async fetchLibraryIndexDataAsync(): Promise<LibraryIndexData> {
    return this.http.get<LibraryIndexData>(
      this.LIBRARY_INDEX_HANDLER).toPromise();
  }

  async fetchCreatorDashboardDataAsync(): Promise<CreatorDashboardData> {
    return this.http.get<CreatorDashboardDataBackendDict>(
      this.CREATOR_DASHBOARD_HANDLER).toPromise();
  }

  async fetchLibraryGroupDataAsync(groupName: string):
  Promise<LibraryGroupData> {
    return this.http.get<LibraryGroupDataBackendDict>(
      this.LIBRARY_GROUP_HANDLER, {
        params: {
          group_name: groupName
        }
      }).toPromise();
  }
}
