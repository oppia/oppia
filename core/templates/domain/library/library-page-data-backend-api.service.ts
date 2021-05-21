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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { CreatorExplorationSummaryBackendDict } from 'domain/summary/creator-exploration-summary.model';

interface LibraryGroupDataBackendDict {
  'activity_list': ActivityDicts[],
  'header_i18n_id': string,
  'preferred_language_codes': string[],
}

interface ActivityDicts {  
  'activity_type': string                                        
  'category': string,
  'community_owned': boolean,
  'id': string,
  'language_code': string,
  'num_views': number,
  'objective': string,
  'status': string,
  'tags': [],
  'thumbnail_bg_color': string,
  'thumbnail_icon_url': string,
  'title': string,
}
interface SummaryDicts {
  'activity_summary_dicts': ActivityDicts[],
  'categories': [],
  'header_i18n_id': string,
  'has_full_results_page': boolean,
  'full_results_url': string,
  'protractor_id' ?: string,
}

interface LibraryIndexDataBackendDict {
  'activity_summary_dicts_by_category': SummaryDicts[],
  'preferred_language_codes': string[]
}

interface CreatorDashboardDataBackendDict {
  'explorations_list': CreatorExplorationSummaryBackendDict[];
  'collections_list': CollectionSummaryBackendDict[];
}

export interface LibraryIndexData {
  activity_summary_dicts_by_category : SummaryDicts[],
  preferred_language_codes: string[]
}

export interface CreatorDashboardData {
  explorations_list: CreatorExplorationSummaryBackendDict[];
  collections_list: CollectionSummaryBackendDict[];
}

export interface LibraryGroupData {
  activity_list: ActivityDicts[],
  header_i18n_id: string,
  preferred_language_codes: string[],
}

@Injectable({
  providedIn: 'root'
})

export class LibraryBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  async fetchLibraryIndexDataAsync(): Promise<LibraryIndexData> {
    return new Promise((resolve, reject) => {
      this.http.get<LibraryIndexDataBackendDict>(
        '/libraryindexhandler').toPromise().then((response) => {
          resolve({  
            activity_summary_dicts_by_category:
              response.activity_summary_dicts_by_category,
            preferred_language_codes: response.preferred_language_codes,
          });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchCreatorDashboardDataAsync(): Promise<CreatorDashboardData> {
    return new Promise((resolve, reject) => {
      this.http.get<CreatorDashboardDataBackendDict>(
        '/creatordashboardhandler/data').toPromise().then((response) => {
          resolve({  
            explorations_list: response.explorations_list,
            collections_list: response.collections_list,
          });
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async fetchLibraryGroupDataAsync(groupName: string): Promise<LibraryGroupData> {
    return new Promise((resolve, reject) => {
      this.http.get<LibraryGroupDataBackendDict>('/librarygrouphandler', {
        params: {
          group_name: groupName
        }
      }).toPromise().then((response) => {
        resolve({
          activity_list: response.activity_list,
          header_i18n_id: response.header_i18n_id,
          preferred_language_codes: response.preferred_language_codes,
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'LibraryBackendApiService',
  downgradeInjectable(LibraryBackendApiService));
  