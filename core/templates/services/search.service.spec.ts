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
 * @fileoverview Tests that search service gets correct collections.
 */

import {EventEmitter} from '@angular/core';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  SearchService,
  SelectionDetails,
  SelectionList,
} from 'services/search.service';
import {Subscription} from 'rxjs';

describe('Search Service', () => {
  let searchService: SearchService;
  let results: SelectionDetails;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService],
    });
    searchService = TestBed.get(SearchService);
  });

  describe('updateSearchFieldsBasedOnUrlQuery', () => {
    let urlComponent: string;
    beforeEach(() => {
      results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: '',
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: '',
        },
      };
    });

    // eslint-disable-next-line max-len
    it('should identify two categories and two languages given in url search query', () => {
      urlComponent =
        '?q=test&category=("Architecture"%20OR%20' +
        '"Mathematics")&language_code=("en"%20OR%20"ar")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true,
      });
      expect(results.categories.selections).toEqual({
        Architecture: true,
        Mathematics: true,
      });
    });
    it('should find one category and two languages if given in url search', () => {
      urlComponent =
        '?q=test&category=("Mathematics")&' +
        'language_code=("en"%20OR%20"ar")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true,
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true,
      });
    });
    it('should find one category and one language if given in url search', () => {
      urlComponent = '?q=test&category=("Mathematics")&language_code=("en")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true,
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true,
      });
    });
    it('should find no categories and one language if given in url search', () => {
      urlComponent = '?q=test&language_code=("en")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true,
      });
      expect(results.categories.selections).toEqual({});
    });

    it('should find as many keywords as provided in search query', () => {
      urlComponent = '?q=protractor%20test&language_code=("en")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('protractor test');
      expect(results.languageCodes.selections).toEqual({
        en: true,
      });
      expect(results.categories.selections).toEqual({});
    });

    it('should not find languages nor categories when ampersand is escaped', () => {
      urlComponent =
        '?q=protractor%20test%26category=("Mathematics")' +
        '%26language_code=("en"%20OR%20"ar")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe(
        'protractor test&category=("Mathematics")' +
          '&language_code=("en" OR "ar")'
      );
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    });

    it('should only use correct fields when ampersand is not escaped anywhere', () => {
      urlComponent =
        '?q=protractor&test&category=("Mathematics")' +
        '&language_code=("en"%20OR%20"ar")';
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('protractor');
      expect(results.languageCodes.selections).toEqual({
        en: true,
        ar: true,
      });
      expect(results.categories.selections).toEqual({Mathematics: true});
    });

    it('should omit url component if it is malformed', () => {
      // In the two cases below, language_code param is not wrapped in
      // parentheses. However, the category param is defined correctly.
      // updateSearchFieldsBasedOnUrlQuery is expected to clean language_code.
      urlComponent =
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar")';
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true,
      });

      urlComponent =
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar"';
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true,
      });

      // In this case, neither of the params are wrapped in parentheses.
      // updateSearchFieldsBasedOnUrlQuery is expected to clean category and
      // language_code.
      urlComponent =
        '?q=protractor%20test&category="Mathematics"&' +
        'language_code="en" OR "ar"';
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    });
  });

  describe('getSearchUrlQueryString', () => {
    it('should successfully get search url query string', () => {
      const searchQuery = '["1", "2"]';
      const categories: SelectionList = {
        exploration: true,
        feedback: true,
      };
      const languageCodes: SelectionList = {
        en: true,
        hi: true,
      };

      expect(
        searchService.getSearchUrlQueryString(
          searchQuery,
          categories,
          languageCodes
        )
      ).toBe(
        '%5B%221%22%2C%20%222%22%5D&category=("exploration" OR "feedback")' +
          '&language_code=("en" OR "hi")'
      );
    });

    it(
      'should successfully get search url query string when there is no' +
        ' category or language_code query params',
      () => {
        const searchQuery = '["1", "2"]';
        const categories = {};
        const languageCodes = {};

        expect(
          searchService.getSearchUrlQueryString(
            searchQuery,
            categories,
            languageCodes
          )
        ).toBe('%5B%221%22%2C%20%222%22%5D');
      }
    );
  });

  describe('executeSearchQuery', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let errorHandler: jasmine.Spy<jasmine.Func>;
    let searchQuery: string;
    let categories: SelectionList;
    let languageCodes: SelectionList;
    let initialSearchResultsLoadedSpy: jasmine.Spy<jasmine.Func>;
    let testSubscriptions: Subscription;
    const SAMPLE_RESULTS = {
      search_cursor: 'notempty',
      activity_list: [],
    };
    const SAMPLE_QUERY =
      '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")';
    beforeEach(() => {
      successHandler = jasmine.createSpy('success');
      errorHandler = jasmine.createSpy('error');
      searchQuery = 'example';
      categories = {
        exploration: true,
      };
      languageCodes = {
        en: true,
        hi: true,
      };
      initialSearchResultsLoadedSpy = jasmine.createSpy(
        'initialSearchResultsLoadedSpy'
      );
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        searchService.onInitialSearchResultsLoaded.subscribe(
          initialSearchResultsLoadedSpy
        )
      );
      httpTestingController = TestBed.get(HttpTestingController);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should successfully execute search query', fakeAsync(() => {
      searchService.executeSearchQuery(
        searchQuery,
        categories,
        languageCodes,
        successHandler
      );
      expect(searchService.isSearchInProgress()).toBe(true);
      const req = httpTestingController.expectOne(SAMPLE_QUERY);
      expect(req.request.method).toEqual('GET');
      req.flush(SAMPLE_RESULTS);
      flushMicrotasks();

      expect(searchService.isSearchInProgress()).toBe(false);
      expect(initialSearchResultsLoadedSpy).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    }));

    it('should use reject handler when fetching query url fails', fakeAsync(() => {
      searchService.executeSearchQuery(
        searchQuery,
        categories,
        languageCodes,
        successHandler,
        errorHandler
      );
      expect(searchService.isSearchInProgress()).toBe(true);
      const req = httpTestingController.expectOne(SAMPLE_QUERY);
      expect(req.request.method).toEqual('GET');
      req.error(new ErrorEvent('network error'));
      flushMicrotasks();

      expect(searchService.isSearchInProgress()).toBe(false);
      expect(errorHandler).toHaveBeenCalled();
    }));

    describe('loadMoreData', () => {
      const MORE_DATA_REQUEST =
        '/searchhandler/data?q=example&category=' +
        '("exploration")&language_code=("en" OR "hi")&offset=notempty';
      const MORE_DATA_RESPONSE = {
        search_cursor: 'newcursor',
      };

      it('should successfully load more data', fakeAsync(() => {
        searchService.executeSearchQuery(
          searchQuery,
          categories,
          languageCodes,
          successHandler,
          errorHandler
        );
        const req = httpTestingController.expectOne(SAMPLE_QUERY);
        expect(req.request.method).toEqual('GET');
        req.flush(SAMPLE_RESULTS);
        flushMicrotasks();

        searchService.loadMoreData(successHandler, errorHandler);
        const moreDataReq = httpTestingController.expectOne(MORE_DATA_REQUEST);
        moreDataReq.flush(MORE_DATA_RESPONSE);
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(MORE_DATA_RESPONSE, false);
        expect(errorHandler).not.toHaveBeenCalled();
      }));

      it('should not load more data when a new query is still being sent', fakeAsync(() => {
        searchService.executeSearchQuery(
          searchQuery,
          categories,
          languageCodes,
          successHandler
        );
        const req = httpTestingController.expectOne(SAMPLE_QUERY);
        expect(req.request.method).toEqual('GET');
        req.flush(SAMPLE_RESULTS);
        flushMicrotasks();

        searchService.loadMoreData(
          () => {},
          () => {}
        );
        searchService.loadMoreData(successHandler, errorHandler);
        const moreDataReq = httpTestingController.expectOne(MORE_DATA_REQUEST);
        moreDataReq.flush(MORE_DATA_RESPONSE);
        flushMicrotasks();
        expect(errorHandler).toHaveBeenCalledWith(false);
      }));

      it('should not load more data when the end of page has been reached', fakeAsync(() => {
        searchService.executeSearchQuery(
          searchQuery,
          categories,
          languageCodes,
          successHandler
        );
        const req = httpTestingController.expectOne(SAMPLE_QUERY);
        expect(req.request.method).toEqual('GET');
        req.flush(SAMPLE_RESULTS);
        flushMicrotasks();

        searchService.loadMoreData(
          () => {},
          () => {}
        );
        const moreDataReq = httpTestingController.expectOne(
          SAMPLE_QUERY + '&offset=notempty'
        );
        moreDataReq.flush({search_cursor: null});
        flushMicrotasks();
        searchService.loadMoreData(successHandler, errorHandler);

        expect(errorHandler).toHaveBeenCalledWith(true);
      }));
    });
  });

  it('should fetch searchBarLoaded EventEmitter', () => {
    let searchBarLoadedEmitter = new EventEmitter();
    expect(searchService.onSearchBarLoaded).toEqual(searchBarLoadedEmitter);
  });
});
