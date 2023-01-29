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
 * @fileoverview Search service for activityTilesInfinityGrid.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, EventEmitter } from '@angular/core';

import { SearchBackendApiService, SearchResponseBackendDict } from './search-backend-api.service';
import { ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';

export interface SelectionList {
  [key: string]: boolean;
}

interface FilterDetails {
  description: string;
  itemsName: string;
  masterList: {
    id: string;
    text: string;
  }[];
  selections: SelectionList;
  numSelections: number;
  summary: string;
}

export interface SelectionDetails {
  [key: string]: FilterDetails;
  categories: FilterDetails;
  languageCodes: FilterDetails;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // These properties are initialized using functions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _lastQuery!: string;
  private _searchOffset!: number | null;
  private _lastSelectedCategories: SelectionList = {};
  private _lastSelectedLanguageCodes: SelectionList = {};
  private _isCurrentlyFetchingResults = false;
  private _searchBarLoadedEventEmitter = new EventEmitter<string>();
  private _initialSearchResultsLoadedEventEmitter =
    new EventEmitter<ExplorationSummaryDict[]>();

  public numSearchesInProgress = 0;

  constructor(
    private _searchBackendApiService: SearchBackendApiService) {
  }

  private _getSuffixForQuery(
      selectedCategories: SelectionList,
      selectedLanguageCodes: SelectionList): string {
    let querySuffix = '';

    let _categories = '';
    for (let key in selectedCategories) {
      if (selectedCategories[key]) {
        if (_categories) {
          _categories += '" OR "';
        }
        _categories += key;
      }
    }
    if (_categories) {
      querySuffix += '&category=("' + _categories + '")';
    }

    let _languageCodes = '';
    for (let key in selectedLanguageCodes) {
      if (selectedLanguageCodes[key]) {
        if (_languageCodes) {
          _languageCodes += '" OR "';
        }
        _languageCodes += key;
      }
    }
    if (_languageCodes) {
      querySuffix += '&language_code=("' + _languageCodes + '")';
    }

    return querySuffix;
  }

  hasReachedEndOfPage(): boolean {
    return this._searchOffset === null;
  }

  updateSearchFields(
      itemsType: string, urlComponent: string,
      selectionDetails: SelectionDetails
  ): void {
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

    const selections = selectionDetails[itemsType].selections;
    for (let i = 0; i < items.length; i++) {
      selections[items[i]] = true;
    }
  }

  getQueryUrl(searchUrlQueryString: string): string {
    return '?q=' + searchUrlQueryString;
  }

  getSearchUrlQueryString(
      searchQuery: string,
      selectedCategories: SelectionList,
      selectedLanguageCodes: SelectionList): string {
    return encodeURIComponent(searchQuery) +
      this._getSuffixForQuery(selectedCategories, selectedLanguageCodes);
  }


  // Note that an empty query results in all activities being shown.
  executeSearchQuery(
      searchQuery: string,
      selectedCategories: SelectionList,
      selectedLanguageCodes: SelectionList,
      successCallback: () => void,
      errorCallback?: (reason: string) => void): void {
    const queryUrl = this.getQueryUrl(
      this.getSearchUrlQueryString(
        searchQuery, selectedCategories, selectedLanguageCodes));

    this._isCurrentlyFetchingResults = true;
    this.numSearchesInProgress++;
    this._searchBackendApiService.fetchExplorationSearchResultAsync(queryUrl)
      .then((response) => {
        this._lastQuery = searchQuery;
        this._lastSelectedCategories = cloneDeep(selectedCategories);
        this._lastSelectedLanguageCodes = cloneDeep(selectedLanguageCodes);
        this._searchOffset = response.search_cursor;
        this.numSearchesInProgress--;

        this._initialSearchResultsLoadedEventEmitter.emit(
          response.activity_list);

        this._isCurrentlyFetchingResults = false;
      }, (errorResponse) => {
        this.numSearchesInProgress--;
        if (errorCallback) {
          errorCallback(errorResponse.error.error);
        }
      });

    if (successCallback) {
      successCallback();
    }
  }

  isSearchInProgress(): boolean {
    return this.numSearchesInProgress > 0;
  }

  /**
   * Takes in the url search component as an argument and the
   * selectionDetails. It will update selectionDetails with the relevant
   * fields that were extracted from the url.
   * @returns the unencoded search query string.
  */
  updateSearchFieldsBasedOnUrlQuery(
      urlComponent: string, selectionDetails: SelectionDetails): string {
    const urlQuery = urlComponent.substring('?q='.length);
    // The following will split the urlQuery into 3 components:
    // 1. query
    // 2. categories (optional)
    // 3. language codes (default to 'en').
    const querySegments = urlQuery.split('&');

    for (let i = 1; i < querySegments.length; i++) {
      urlComponent = decodeURIComponent(querySegments[i]);

      let itemsType = null;
      if (urlComponent.indexOf('category') === 0) {
        itemsType = 'categories';
      } else if (urlComponent.indexOf('language_code') === 0) {
        itemsType = 'languageCodes';
      } else {
        continue;
      }

      try {
        this.updateSearchFields(itemsType, urlComponent, selectionDetails);
      } catch (error) {
        selectionDetails[itemsType].selections = {};
      }
    }

    return decodeURIComponent(querySegments[0]);
  }

  getCurrentUrlQueryString(): string {
    return this.getSearchUrlQueryString(
      this._lastQuery,
      this._lastSelectedCategories,
      this._lastSelectedLanguageCodes
    );
  }

  // Here failure callback is optional so that it gets invoked
  // only when the end of page has reached and return void otherwise.
  loadMoreData(
      successCallback: (
        SearchResponseData: SearchResponseBackendDict,
        boolean: boolean
      ) => void,
      failureCallback?: (arg0: boolean) => void
  ): void {
    // If a new query is still being sent, or the end of the page has been
    // reached, do not fetch more results.
    if (this._isCurrentlyFetchingResults || this.hasReachedEndOfPage()) {
      if (failureCallback) {
        failureCallback(this.hasReachedEndOfPage());
      }
      return;
    }

    let queryUrl = this.getQueryUrl(this.getCurrentUrlQueryString());

    if (this._searchOffset) {
      queryUrl += '&offset=' + this._searchOffset;
    }

    this._isCurrentlyFetchingResults = true;
    this._searchBackendApiService.fetchExplorationSearchResultAsync(queryUrl)
      .then((response) => {
        this._searchOffset = response.search_cursor;
        this._isCurrentlyFetchingResults = false;

        if (successCallback) {
          successCallback(response, this.hasReachedEndOfPage());
        }
      });
  }

  get onSearchBarLoaded(): EventEmitter<string> {
    return this._searchBarLoadedEventEmitter;
  }

  get onInitialSearchResultsLoaded():
    EventEmitter<ExplorationSummaryDict[]> {
    return this._initialSearchResultsLoadedEventEmitter;
  }
}

angular.module('oppia').factory(
  'SearchService',
  downgradeInjectable(SearchService)
);
