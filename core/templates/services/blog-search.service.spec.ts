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
 * @fileoverview Tests that blog post search service gets correct results.
 */

import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { BlogPostSearchService, UrlSearchQuery } from 'services/blog-search.service';
import { BlogHomePageBackendApiService, SearchResponseData } from 'domain/blog/blog-homepage-backend-api.service';
import { Subscription } from 'rxjs';

describe('Blog Post Search Service', () => {
  let searchService: BlogPostSearchService;
  let blogHomePageBackendApiService: BlogHomePageBackendApiService;
  let response: UrlSearchQuery;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BlogPostSearchService,
        BlogHomePageBackendApiService,
      ]
    });
    searchService = TestBed.inject(BlogPostSearchService);
    blogHomePageBackendApiService = TestBed.inject(
      BlogHomePageBackendApiService);
  });

  describe('updateSearchFieldsBasedOnUrlQuery', () => {
    let urlSearchQuery: string;

    // eslint-disable-next-line max-len
    it('should identify two tags given in url search query', () => {
      urlSearchQuery = '?q=testBlogSearch&tags=("News"%20OR%20"Mathematics")';
      response = searchService.updateSearchFieldsBasedOnUrlQuery(
        urlSearchQuery);
      expect(response.selectedTags.sort()).toEqual(['Mathematics', 'News']);
      expect(response.searchQuery).toEqual('testBlogSearch');
    });

    it('should find one tag if given in url search without query',
      () => {
        urlSearchQuery = '?q=&tags=("News"%20OR%20"Mathematics")';
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags.sort()).toEqual(['Mathematics', 'News']);
        expect(response.searchQuery).toBe('');
      }
    );
    it('should find no tags if not given in url search',
      () => {
        urlSearchQuery = '?q=test';
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags.length).toBe(0);
        expect(response.searchQuery).toEqual('test');
      }
    );

    it('should find as many keywords as provided in search query',
      () => {
        urlSearchQuery = '?q=protractor%20blog%20test&tags=("News"%20OR%20' +
        '"Mathematics")';
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags.sort()).toEqual(['Mathematics', 'News']);
        expect(response.searchQuery).toEqual('protractor blog test');
      }
    );

    it('should not find tags when ampersand is escaped',
      () => {
        urlSearchQuery = '?q=protractor%20test%26tags=("Mathematics")';
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags.length).toBe(0);
        expect(response.searchQuery).toEqual(
          'protractor test&tags=("Mathematics")');
      }
    );

    it('should only use correct fields when ampersand is not escaped anywhere',
      () => {
        urlSearchQuery = '?q=protractor&test&tags=("Mathematics")';
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags).toEqual(['Mathematics']);
        expect(response.searchQuery).toEqual(
          'protractor');
      }
    );

    it('should omit url component if it is malformed',
      () => {
        // In the search query below tags param are not wrapped in parentheses.
        // updateSearchFieldsBasedOnUrlQuery is expected to clean tags from url.
        urlSearchQuery = (
          '?q=protractor%20test&tags="Mathematics"');
        response = searchService.updateSearchFieldsBasedOnUrlQuery(
          urlSearchQuery);
        expect(response.selectedTags.length).toBe(0);
        expect(response.searchQuery).toEqual('protractor test');
      }
    );
  });

  describe('getSearchUrlQueryString', () => {
    it('should successfully get search url query string', () => {
      const searchQuery = 'blog search';
      const tags = ['tag1', 'tag2'];

      expect(searchService.getSearchUrlQueryString(searchQuery, tags)).toBe(
        'blog%20search&tags=("tag1" OR "tag2")');
    });

    it('should successfully get search url query string when there is no' +
      'tags query params', () => {
      const searchQuery: string = 'blog search';
      const tags: string[] = [];

      expect(searchService.getSearchUrlQueryString(searchQuery, tags)).toBe(
        'blog%20search');
    });

    it('should successfully get search url query string when there is no' +
    ' query params', () => {
      const searchQuery = '';
      const tags = ['tag1', 'tag2'];

      expect(searchService.getSearchUrlQueryString(searchQuery, tags)).toBe(
        '&tags=("tag1" OR "tag2")');
    });
  });

  describe('executeSearchQuery', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let errorHandler: jasmine.Spy<jasmine.Func>;
    let searchQuery: string;
    let tags: string[];
    let initialSearchResultsLoadedSpy: jasmine.Spy<jasmine.Func>;
    let testSubscriptions: Subscription;
    let sampleResponse: SearchResponseData;
    beforeEach(() => {
      searchQuery = 'example';
      tags = ['tag1', 'tag2'];
      initialSearchResultsLoadedSpy = jasmine.createSpy(
        'initialSearchResultsLoadedSpy');
      successHandler = jasmine.createSpy('success');
      errorHandler = jasmine.createSpy('error');
      sampleResponse = {
        searchOffset: 2,
        blogPostSummariesList: [],
        listOfDefaultTags: [],
      };
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        searchService.onInitialSearchResultsLoaded.subscribe(
          initialSearchResultsLoadedSpy
        ));
    });

    it('should successfully execute search query', fakeAsync(() => {
      spyOn(blogHomePageBackendApiService, 'fetchBlogPostSearchResultAsync')
        .and.returnValue(Promise.resolve(sampleResponse));

      searchService.executeSearchQuery(
        searchQuery, tags, () => {});
      expect(searchService.isSearchInProgress()).toBe(true);

      tick();

      expect(blogHomePageBackendApiService.fetchBlogPostSearchResultAsync)
        .toHaveBeenCalled();
      expect(searchService.isSearchInProgress()).toBe(false);
      expect(initialSearchResultsLoadedSpy).toHaveBeenCalled();
    }));

    it('should use reject handler if fetching data fails while search exec',
      fakeAsync(() => {
        spyOn(blogHomePageBackendApiService, 'fetchBlogPostSearchResultAsync')
          .and.returnValue(Promise.reject({
            error: {error: 'Some error in the backend.'}
          }));

        searchService.executeSearchQuery(
          searchQuery, tags, () => {}, errorHandler);
        expect(searchService.isSearchInProgress()).toBe(true);

        tick();

        expect(searchService.isSearchInProgress()).toBe(false);
        expect(blogHomePageBackendApiService.fetchBlogPostSearchResultAsync)
          .toHaveBeenCalled();
        expect(errorHandler).toHaveBeenCalledWith(
          'Some error in the backend.');
      }));

    describe('loadMoreData', () => {
      let moreSampleResponse: SearchResponseData = {
        searchOffset: 1,
        blogPostSummariesList: [],
        listOfDefaultTags: [],
      };

      it('should successfully load more data', fakeAsync(() => {
        spyOn(blogHomePageBackendApiService, 'fetchBlogPostSearchResultAsync')
          .and.returnValues(
            Promise.resolve(sampleResponse),
            Promise.resolve(moreSampleResponse)
          );

        searchService.executeSearchQuery(searchQuery, tags, () => {});
        tick();
        expect(initialSearchResultsLoadedSpy).toHaveBeenCalled();

        searchService.loadMoreData(successHandler, errorHandler);
        tick();

        expect(successHandler).toHaveBeenCalledWith(moreSampleResponse);
        expect(errorHandler).not.toHaveBeenCalled();
      }));

      it('should not load more data when a new query is still being sent',
        fakeAsync(() => {
          spyOn(blogHomePageBackendApiService, 'fetchBlogPostSearchResultAsync')
            .and.returnValues(
              Promise.resolve(sampleResponse),
              Promise.resolve(moreSampleResponse)
            );

          searchService.executeSearchQuery(searchQuery, tags, () => {});
          tick();
          expect(initialSearchResultsLoadedSpy).toHaveBeenCalled();

          searchService.loadMoreData(successHandler);
          searchService.loadMoreData(successHandler, errorHandler);
          tick();
          expect(errorHandler).toHaveBeenCalledWith(false);
        }));

      it('should not load more data when the end of page has been reached',
        fakeAsync(() => {
          let lastSampleResponse: SearchResponseData = {
            searchOffset: null,
            blogPostSummariesList: [],
            listOfDefaultTags: [],
          };
          spyOn(blogHomePageBackendApiService, 'fetchBlogPostSearchResultAsync')
            .and.returnValues(
              Promise.resolve(sampleResponse),
              Promise.resolve(lastSampleResponse),
            );

          searchService.executeSearchQuery(searchQuery, tags, () => {});
          tick();
          expect(initialSearchResultsLoadedSpy).toHaveBeenCalled();

          searchService.loadMoreData(successHandler);
          tick();
          expect(successHandler).toHaveBeenCalledWith(lastSampleResponse);
          expect(errorHandler).not.toHaveBeenCalled();

          searchService.loadMoreData(successHandler, errorHandler);
          tick();
          expect(errorHandler).toHaveBeenCalledWith(true);
        }));
    });
  });

  it('should fetch searchBarLoaded EventEmitter', () => {
    let searchBarLoadedEmitter = new EventEmitter();
    expect(searchService.onSearchBarLoaded).toEqual(searchBarLoadedEmitter);
  });
});
