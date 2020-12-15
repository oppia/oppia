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
 * @fileoverview search service for activityTilesInfinityGrid
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ServicesConstants } from 'services/services.constants';
import { ExplorationSummaryBackendDict } from 'domain/summary/exploration-summary-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private lastQuery: string = null;
  private lastSelectedCategories: SelectionList = {};
  private lastSelectedLanguageCodes: SelectionList = {};
  private searchCursor: string = null;
  private isCurrentlyFetchingResults = false;
  private searchBarLoadedEventEmitter = new EventEmitter<string>();
  private initialSearchResultsLoadedEventEmitter =
    new EventEmitter<ExplorationSummaryBackendDict>();
  public numSearchesInProgress = 0;

  constructor(
    private http: HttpClient) {
  }

  private getSuffixForQuery(
      selectedCategories:SelectionList,
      selectedLanguageCodes:SelectionList) {
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

  hasReachedEndOfPage():boolean {
    return this.searchCursor === null;
  }

  updateSearchFields(
      itemsType:string, urlComponent:string, selectionDetails:SelectionDetails)
      :void {
    const itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
    const itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;

    const EXPECTED_PREFIX = '=("';
    const EXPECTED_SUFFIX = '")';

    if (!itemCodes ||
        itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
        itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
          itemCodes.length - EXPECTED_SUFFIX.length) {
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

  getQueryUrl(searchUrlQueryString: string):string {
    return ServicesConstants.SEARCH_DATA_URL + '?q=' + searchUrlQueryString;
  }

  getSearchUrlQueryString(
      searchQuery:string,
      selectedCategories:SelectionList,
      selectedLanguageCodes:SelectionList):string {
    return encodeURIComponent(searchQuery) +
      this.getSuffixForQuery(selectedCategories, selectedLanguageCodes);
  }


  // Note that an empty query results in all activities being shown.
  executeSearchQuery(
      searchQuery:string,
      selectedCategories: SelectionList,
      selectedLanguageCodes: SelectionList,
      successCallback:()=>void,
      errorCallback?:(reason: string)=>void): void {
    const queryUrl = this.getQueryUrl(
      this.getSearchUrlQueryString(
        searchQuery, selectedCategories, selectedLanguageCodes));

    this.isCurrentlyFetchingResults = true;
    this.numSearchesInProgress++;
    this.http.get<SearchResponse>(queryUrl).toPromise()
      .then((response) => {
        this.lastQuery = searchQuery;
        this.lastSelectedCategories = angular.copy(selectedCategories);
        this.lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
        this.searchCursor = response.search_cursor;
        this.numSearchesInProgress--;

        this.initialSearchResultsLoadedEventEmitter.emit(
          response.activity_list);

        this.isCurrentlyFetchingResults = false;
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
      urlComponent:string, selectionDetails:SelectionDetails): string {
    var urlQuery = urlComponent.substring('?q='.length);
    // The following will split the urlQuery into 3 components:
    // 1. query
    // 2. categories (optional)
    // 3. language codes (default to 'en').
    var querySegments = urlQuery.split('&');

    for (var i = 1; i < querySegments.length; i++) {
      urlComponent = decodeURIComponent(querySegments[i]);

      var itemsType = null;
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

  getCurrentUrlQueryString():string {
    return this.getSearchUrlQueryString(
      this.lastQuery,
      this.lastSelectedCategories,
      this.lastSelectedLanguageCodes
    );
  }

  loadMoreData(
      successCallback:(SearchResponseData, boolean)=>void,
      failureCallback?:(any)=>void): void {
    // If a new query is still being sent, or the end of the page has been
    // reached, do not fetch more results.
    if (this.isCurrentlyFetchingResults || this.hasReachedEndOfPage()) {
      failureCallback(this.hasReachedEndOfPage());
      return;
    }

    var queryUrl = this.getQueryUrl(this.getCurrentUrlQueryString());

    if (this.searchCursor) {
      queryUrl += '&cursor=' + this.searchCursor;
    }

    this.isCurrentlyFetchingResults = true;
    this.http.get<SearchResponse>(queryUrl).toPromise().then((response) => {
      this.searchCursor = response.search_cursor;
      this.isCurrentlyFetchingResults = false;

      if (successCallback) {
        successCallback(response, this.hasReachedEndOfPage());
      }
    });
  }

  get onSearchBarLoaded(): EventEmitter<string> {
    return this.searchBarLoadedEventEmitter;
  }

  get onInitialSearchResultsLoaded():
    EventEmitter<ExplorationSummaryBackendDict> {
    return this.initialSearchResultsLoadedEventEmitter;
  }
}

export interface SelectionList {[key: string]: boolean}

export interface FilterDetails {
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
  categories: FilterDetails;
  languageCodes: FilterDetails;
}

// SELF QUESTION: should there be a backend-api interface defined for this?
export interface SearchResponse {
  'search_cursor': string;
  'activity_list': ExplorationSummaryBackendDict;
}

angular.module('oppia').factory(
  'SearchService',
  downgradeInjectable(SearchService)
);
