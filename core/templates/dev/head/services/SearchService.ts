// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
import { HttpClient } from '@angular/common/http';
import { EventService } from './EventService';
import { LoggerService } from './LoggerService';
import { ServicesConstants } from 'services/services.constants';
import { TranslateService } from '@ngx-translate/core';

require('services/services.constants.ajs.ts');

export class SearchService {
  constructor(private eventService: EventService,
              private logger: LoggerService,
              private httpClient: HttpClient,
              private translate: TranslateService) {}

  _lastQuery = null;
  _lastSelectedCategories = {};
  _lastSelectedLanguageCodes = {};
  _searchCursor = null;
  _isCurrentlyFetchingResults = false;
  numSearchesInProgress = 0;

  // Appends a suffix to the query describing allowed category and language
  // codes to filter on.
  private _getSuffixForQuery(selectedCategories: Object,
      selectedLanguageCodes: Object): string {
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
    return this._searchCursor === null;
  }

  updateSearchFields(itemsType: string, urlComponent: string,
      selectionDetails: Object): void {
    let itemCodeGroup = urlComponent.match(/=\("[A-Za-z%20" ]+"\)/);
    let itemCodes = itemCodeGroup ? itemCodeGroup[0] : null;

    let EXPECTED_PREFIX = '=("';
    let EXPECTED_SUFFIX = '")';

    if (!itemCodes ||
        itemCodes.indexOf(EXPECTED_PREFIX) !== 0 ||
        itemCodes.lastIndexOf(EXPECTED_SUFFIX) !==
        itemCodes.length - EXPECTED_SUFFIX.length) {
      throw Error('Invalid search query url fragment for ' +
          itemsType + ': ' + urlComponent);
    }

    let items = itemCodes.substring(
      EXPECTED_PREFIX.length, itemCodes.length - EXPECTED_SUFFIX.length
    ).split('" OR "');

    let selections = selectionDetails[itemsType].selections;
    for (let i = 0; i < items.length; i++) {
      selections[items[i]] = true;
    }
  }


  getQueryUrl(searchUrlQueryString: string): string {
    return ServicesConstants.SEARCH_DATA_URL + '?q=' + searchUrlQueryString;
  }

  getSearchUrlQueryString(searchQuery: string, selectedCategories: Object,
      selectedLanguageCodes: Object): string {
    return encodeURIComponent(searchQuery) +
        this._getSuffixForQuery(selectedCategories, selectedLanguageCodes);
  }
  // Note that an empty query results in all activities being shown.
  executeSearchQuery(
      searchQuery: string, selectedCategories: Object,
      selectedLanguageCodes: Object,
      successCallback: Function | undefined): boolean | void {
    let queryUrl = this.getQueryUrl(
      this.getSearchUrlQueryString(
        searchQuery, selectedCategories, selectedLanguageCodes));

    this._isCurrentlyFetchingResults = true;
    this.numSearchesInProgress++;

    // TODO(#7165): Replace 'any' with the exact type. This response is coming
    // from the backend so we need to check what response we are getting
    this.httpClient.get(queryUrl).subscribe((response: any) => {
      let data = response.data;
      this._lastQuery = searchQuery;
      this._lastSelectedCategories = angular.copy(selectedCategories);
      this._lastSelectedLanguageCodes = angular.copy(selectedLanguageCodes);
      this._searchCursor = data.search_cursor;
      this.numSearchesInProgress--;

      this.eventService.BroadcastEvent('initialSearchResultsLoaded',
        data.activity_list);
      this._isCurrentlyFetchingResults = false;
      let checkMismatch = (searchQuery) => {
        let isMismatch = true;
        $('.oppia-search-bar-input').each(function(index) {
          if ((<string>$(this).val()).trim() === searchQuery) {
            isMismatch = false;
          }
        });
        return isMismatch;
      };
      if (checkMismatch(searchQuery)) {
        this.logger.error('Mismatch');
        this.logger.error('SearchQuery: ' + searchQuery);
        this.logger.error('Input: ' + (
            <string><any>$('.oppia-search-bar-input').val()).trim());
      }
    }, () => {
      this.numSearchesInProgress--;
    });

    // Translate the new explorations loaded.
    this.translate.use(searchQuery);

    if (successCallback) {
      successCallback();
    }
  }

  isSearchInProgress(): boolean {
    return this.numSearchesInProgress > 0;
  }

  // The following takes in the url search component as an argument and the
  // selectionDetails. It will update selectionDetails with the relevant
  // fields that were extracted from the url. It returns the unencoded
  // search query string.
  updateSearchFieldsBasedOnUrlQuery(
      urlComponent: string, selectionDetails: Object): string {
    let urlQuery = urlComponent.substring('?q='.length);
    // The following will split the urlQuery into 3 components:
    // 1. query
    // 2. categories (optional)
    // 3. language codes (default to 'en')
    let querySegments = urlQuery.split('&');

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
      this._lastQuery, this._lastSelectedCategories,
      this._lastSelectedLanguageCodes);
  }

  loadMoreData(successCallback: Function, failureCallback: Function): void {
    // If a new query is still being sent, or the end of the page has been
    // reached, do not fetch more results.
    if (this._isCurrentlyFetchingResults || this.hasReachedEndOfPage()) {
      failureCallback(this.hasReachedEndOfPage());
      return;
    }

    let queryUrl = this.getQueryUrl(this.getCurrentUrlQueryString());

    if (this._searchCursor) {
      queryUrl += '&cursor=' + this._searchCursor;
    }

    this._isCurrentlyFetchingResults = true;

    // TODO(#7165): Replace 'any' with the exact type. This response is coming
    // from the backend so we need to check what response we are getting
    this.httpClient.get(queryUrl).subscribe((response: any) => {
      this._searchCursor = response.data.search_cursor;
      this._isCurrentlyFetchingResults = false;

      if (successCallback) {
        successCallback(response.data, this.hasReachedEndOfPage());
      }
    });
  }
}

angular.module('oppia').factory(
  'SearchService',
  downgradeInjectable(SearchService));
