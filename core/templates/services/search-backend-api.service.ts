// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for executing searches.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';
import { ServicesConstants } from './services.constants';

export class SearchResponseBackendDict {
  'search_cursor': number | null;
  'activity_list': ExplorationSummaryDict[];
}


@Injectable({
  providedIn: 'root'
})
export class SearchBackendApiService {
  constructor(private http: HttpClient) {}

  async fetchExplorationSearchResultAsync(
      searchQuery: string): Promise<SearchResponseBackendDict> {
    return this.http.get<SearchResponseBackendDict>(
      ServicesConstants.SEARCH_DATA_URL + searchQuery).toPromise();
  }
}

angular.module('oppia').factory(
  'SearchBackendApiService',
  downgradeInjectable(SearchBackendApiService));
