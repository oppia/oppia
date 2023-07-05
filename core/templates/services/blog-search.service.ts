// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Search service for Blog Posts.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, EventEmitter } from '@angular/core';

import { BlogHomePageBackendApiService, SearchResponseData } from 'domain/blog/blog-homepage-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';

export interface UrlSearchQuery {
  searchQuery: string;
  selectedTags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BlogPostSearchService {
  // These properties are initialized using functions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _lastQuery!: string;
  private _searchOffset!: number | null;
  private _lastSelectedTags: string[] = [];
  private _isCurrentlyFetchingResults = false;
  private _searchBarLoadedEventEmitter = new EventEmitter<string>();
  private _initialSearchResultsLoadedEventEmitter =
    new EventEmitter<SearchResponseData>();

  public numSearchesInProgress = 0;

  constructor(
    private _blogHomePageBackendApiService: BlogHomePageBackendApiService,
  ) {}

  private _getSuffixForQuery(selectedTags: string[]): string {
    let querySuffix = '';

    let _tags = '';
    for (let tag of selectedTags) {
      if (_tags) {
        _tags += '" OR "';
      }
      _tags += tag;
    }
    if (_tags) {
      querySuffix += '&tags=("' + _tags + '")';
    }
    return querySuffix;
  }

  hasReachedLastPage(): boolean {
    return this._searchOffset === null;
  }

  _getSelectedTagsFromUrl(itemsType: string, urlComponent: string): string[] {
    // Returns list of tags for which the filter is applied from the url.
    const itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
    const itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;

    const EXPECTED_PREFIX = '=("';
    const EXPECTED_SUFFIX = '")';

    if (!itemCodes ||
        itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
        itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
          itemCodes.length - EXPECTED_SUFFIX.length ||
          itemCodes.lastIndexOf(EXPECTED_SUFFIX) === -1) {
      throw new Error(
        'Invalid search query url fragment for ' +
        itemsType + ': ' + urlComponent);
    }

    const items = itemCodes.substring(
      EXPECTED_PREFIX.length, itemCodes.length - EXPECTED_SUFFIX.length
    ).split('" OR "');

    return items;
  }


  getQueryUrl(searchUrlQueryString: string): string {
    return '?q=' + searchUrlQueryString;
  }

  getSearchUrlQueryString(
      searchQuery: string,
      selectedTags: string[]
  ): string {
    return encodeURIComponent(searchQuery) +
      this._getSuffixForQuery(selectedTags);
  }


  // Note that an empty query results in all blog posts being shown.
  executeSearchQuery(
      searchQuery: string,
      selectedTags: string[],
      successCallback: () => void,
      errorCallback?: (reason: string) => void): void {
    const queryUrl = this.getQueryUrl(
      this.getSearchUrlQueryString(searchQuery, selectedTags));
    this._isCurrentlyFetchingResults = true;
    this.numSearchesInProgress++;
    this._blogHomePageBackendApiService.fetchBlogPostSearchResultAsync(
      queryUrl
    ).then((response: SearchResponseData) => {
      this._lastQuery = searchQuery;
      this._lastSelectedTags = cloneDeep(selectedTags);
      this._searchOffset = response.searchOffset;
      this.numSearchesInProgress--;

      this._initialSearchResultsLoadedEventEmitter.emit(response);

      this._isCurrentlyFetchingResults = false;
    }, (error) => {
      this.numSearchesInProgress--;
      if (errorCallback) {
        errorCallback(error.error.error);
      }
    });

    if (successCallback) {
      successCallback();
    }
  }

  isSearchInProgress(): boolean {
    return this.numSearchesInProgress > 0;
  }

  updateSearchFieldsBasedOnUrlQuery(
      urlComponent: string): UrlSearchQuery {
    let newSearchQuery: UrlSearchQuery = {
      searchQuery: '',
      selectedTags: [],
    };
    const urlQuery = urlComponent.substring('?q='.length);
    // The following will split the urlQuery into 2 components:
    // 1. query
    // 2. tags (optional)
    const querySegments = urlQuery.split('&');
    let selectedTags: string[] = [];
    newSearchQuery.searchQuery = decodeURIComponent(querySegments[0]);
    for (let i = 1; i < querySegments.length; i++) {
      urlComponent = decodeURIComponent(querySegments[i]);
      let itemsType = null;
      if (urlComponent.indexOf('tags') === 0) {
        itemsType = 'tags';
      } else {
        continue;
      }
      try {
        selectedTags = this._getSelectedTagsFromUrl(itemsType, urlComponent);
      } catch (error) {
        selectedTags = [];
      }
    }
    newSearchQuery.selectedTags = selectedTags;
    return newSearchQuery;
  }

  getCurrentUrlQueryString(): string {
    return this.getSearchUrlQueryString(
      this._lastQuery,
      this._lastSelectedTags,
    );
  }

  // Here failure callback is optional so that it gets invoked
  // only when the end of page has reached and return void otherwise.
  loadMoreData(
      successCallback: (
        SearchResponseData: SearchResponseData
      ) => void,
      failureCallback?: (arg0: boolean) => void
  ): void {
    // If a new query is still being sent, or the last page has been
    // reached, do not fetch more results.
    if (this._isCurrentlyFetchingResults || this.hasReachedLastPage()) {
      if (failureCallback) {
        failureCallback(this.hasReachedLastPage());
      }
      return;
    }

    let queryUrl = this.getQueryUrl(this.getCurrentUrlQueryString());

    if (this._searchOffset) {
      queryUrl += '&offset=' + this._searchOffset;
    }

    this._isCurrentlyFetchingResults = true;
    this._blogHomePageBackendApiService.fetchBlogPostSearchResultAsync(
      queryUrl
    ).then((data: SearchResponseData) => {
      this._searchOffset = data.searchOffset;
      this._isCurrentlyFetchingResults = false;

      if (successCallback) {
        successCallback(data);
      }
    });
  }

  get onSearchBarLoaded(): EventEmitter<string> {
    return this._searchBarLoadedEventEmitter;
  }

  get onInitialSearchResultsLoaded():
    EventEmitter<SearchResponseData> {
    return this._initialSearchResultsLoadedEventEmitter;
  }

  get lastSelectedTags(): string[] {
    return this._lastSelectedTags;
  }
}

angular.module('oppia').factory(
  'BlogPostSearchService',
  downgradeInjectable(BlogPostSearchService)
);
