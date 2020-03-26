// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to search explorations metadata.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { LibraryPageConstants } from
  'pages/library-page/library-page.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class SearchExplorationsBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private _fetchExplorations(
      searchQuery: string, successCallback: (
      value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void): void {
    var queryUrl = this.urlInterpolationService.interpolateUrl(
      LibraryPageConstants.SEARCH_EXPLORATION_URL_TEMPLATE, {
        query: btoa(searchQuery)
      }
    );
    this.http.get(queryUrl).toPromise().then((response) => {
      successCallback(response);
    }, (errorResponse) => {
      errorCallback(errorResponse);
    });
  }

  /**
   * Returns exploration's metadata dict, given a search query. Search
   * queries are tokens that will be matched against exploration's title
   * and objective.
   */
  fetchExplorations(searchQuery: string): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExplorations(searchQuery, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'SearchExplorationsBackendApiService',
  downgradeInjectable(SearchExplorationsBackendApiService));
