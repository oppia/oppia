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
 * @fileoverview Tests that average ratings are being computed correctly.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
// The import below is to successfully mock Jquery
import $ from 'jquery';

require('services/search.service.ts');

describe('Search service', function() {
  var SearchService = null;
  var $httpBackend = null;
  var $log = null;
  var $rootScope = null;
  var $translate = null;
  var CsrfService = null;
  var results = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $q) {
    SearchService = $injector.get('SearchService');
    $log = $injector.get('$log');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $translate = $injector.get('$translate');

    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    spyOn($rootScope, '$broadcast').and.callThrough();
    spyOn($translate, 'refresh').and.callThrough();

    results = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: [],
        numSelections: 0,
        selections: {},
        summary: ''
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: [],
        numSelections: 0,
        selections: {},
        summary: ''
      }
    };
  }));

  it('should find two categories and two languages if given in url search',
    function() {
      var urlComponent = '?q=test&category=("Architecture"%20OR%20' +
                         '"Mathematics")&language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true
      });
      expect(results.categories.selections).toEqual({
        Architecture: true,
        Mathematics: true
      });
    });

  it('should find one category and two languages if given in url search',
    function() {
      var urlComponent = '?q=test&category=("Mathematics")&' +
                         'language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );

  it('should find one category and one language if given in url search',
    function() {
      var urlComponent =
        '?q=test&category=("Mathematics")&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );

  it('should find no categories and one language if given in url search',
    function() {
      var urlComponent = '?q=test&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should find as many keywords as provided in search query',
    function() {
      var urlComponent = '?q=protractor%20test&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should not find languages nor categories when ampersand is escaped',
    function() {
      var urlComponent = '?q=protractor%20test%26category=("Mathematics")' +
                         '%26language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test&category=("Mathematics")' +
                       '&language_code=("en" OR "ar")');
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should only use correct fields when ampersand is not escaped anywhere',
    function() {
      var urlComponent = '?q=protractor&test&category=("Mathematics")' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('protractor');
      expect(results.languageCodes.selections).toEqual({
        en: true,
        ar: true
      });
      expect(results.categories.selections).toEqual({Mathematics: true});
    }
  );

  it('should omit url component if it is malformed',
    function() {
      // In the two cases below, language_code param is not wrapped in
      // parentheses. However, the category param is defined correctly.
      // updateSearchFieldsBasedOnUrlQuery is expected to clean language_code.
      var urlComponent = (
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar")');
      SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });

      var urlComponent = (
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar"');
      SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });

      // In this case, neither of the params are wrapped in parentheses.
      // updateSearchFieldsBasedOnUrlQuery is expected to clean category and
      // language_code.
      var urlComponent = (
        '?q=protractor%20test&category="Mathematics"&' +
        'language_code="en" OR "ar"');
      SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should successfully get search url query string', function() {
    var searchQuery = '["1", "2"]';
    var categories = {
      exploration: true,
      feedback: true
    };
    var languageCodes = {
      en: true,
      hi: true
    };

    expect(SearchService.getSearchUrlQueryString(
      searchQuery, categories, languageCodes)).toBe(
      '%5B%221%22%2C%20%222%22%5D&category=("exploration" OR "feedback")' +
      '&language_code=("en" OR "hi")');
  });

  it('should successfully get search url query string when there is no' +
    ' category or language_code query params', function() {
    var searchQuery = '["1", "2"]';
    var categories = {};
    var languageCodes = {};

    expect(SearchService.getSearchUrlQueryString(
      searchQuery, categories, languageCodes)).toBe(
      '%5B%221%22%2C%20%222%22%5D');
  });

  it('should successfully execute search query with match', function() {
    var successHandler = jasmine.createSpy('success');
    var searchQuery = 'example';
    var categories = {
      exploration: true
    };
    var languageCodes = {
      en: true,
      hi: true
    };
    var mockInput = document.createElement('input');
    // @ts-ignore
    var jquerySpy = spyOn(window, '$');
    // @ts-ignore
    jquerySpy.withArgs('.oppia-search-bar-input').and.returnValue(
      // @ts-ignore
      $(mockInput).val(searchQuery));
    // @ts-ignore
    jquerySpy.withArgs(mockInput).and.callThrough();

    $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")')
      .respond(200, {
        search_cursor: 'notempty',
        activity_list: []
      });
    SearchService.executeSearchQuery(
      searchQuery, categories, languageCodes, successHandler);
    expect(SearchService.isSearchInProgress()).toBe(true);
    $httpBackend.flush();

    expect(SearchService.isSearchInProgress()).toBe(false);
    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'initialSearchResultsLoaded', []);
    expect($translate.refresh).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should successfully execute search query with no match', function() {
    var logErrorSpy = spyOn($log, 'error').and.callThrough();
    var successHandler = jasmine.createSpy('success');
    var searchQuery = 'example';
    var categories = {
      exploration: true
    };
    var languageCodes = {
      en: true,
      hi: true
    };
    var mockInput = document.createElement('input');
    // @ts-ignore
    var jquerySpy = spyOn(window, '$');

    // @ts-ignore
    jquerySpy.withArgs('.oppia-search-bar-input').and.returnValue(
      // @ts-ignore
      $(mockInput).val('mismatch'));
    // @ts-ignore
    jquerySpy.withArgs(mockInput).and.callThrough();

    $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")')
      .respond({
        search_cursor: 'notempty',
        activity_list: []
      });
    SearchService.executeSearchQuery(
      searchQuery, categories, languageCodes, successHandler);
    expect(SearchService.isSearchInProgress()).toBe(true);
    $httpBackend.flush();

    expect(SearchService.isSearchInProgress()).toBe(false);
    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'initialSearchResultsLoaded', []);
    expect(logErrorSpy).toHaveBeenCalled();
    expect($translate.refresh).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should use reject handler when fetching query url fails', function() {
    var successHandler = jasmine.createSpy('success');
    var searchQuery = 'example';
    var categories = {
      exploration: true
    };
    var languageCodes = {
      en: true,
      hi: true
    };

    $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")')
      .respond(500, 'Error on getting query url');
    expect(SearchService.executeSearchQuery(
      searchQuery, categories, languageCodes, successHandler));
    expect(SearchService.isSearchInProgress()).toBe(true);
    $httpBackend.flush();

    expect(SearchService.isSearchInProgress()).toBe(false);
    expect($rootScope.$broadcast).not.toHaveBeenCalled();
    expect($translate.refresh).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should successfully load more data', function() {
    var successHandler = jasmine.createSpy('success');
    var searchQuery = 'example';
    var categories = {
      exploration: true
    };
    var languageCodes = {
      en: true,
      hi: true
    };
    var response = {
      search_cursor: 'newcursor'
    };

    // set _last variables
    $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")')
      .respond(200, {
        search_cursor: 'notempty',
        activity_list: []
      });
    SearchService.executeSearchQuery(
      searchQuery, categories, languageCodes, successHandler);
    $httpBackend.flush();

    var successHandler = jasmine.createSpy('sucess');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
      '("exploration")&language_code=("en" OR "hi")&cursor=notempty')
      .respond(200, response);
    SearchService.loadMoreData(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(response, false);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should not load more data when a new query is still being sent',
    function() {
      var successHandler = jasmine.createSpy('success');
      var searchQuery = 'example';
      var categories = {
        exploration: true
      };
      var languageCodes = {
        en: true,
        hi: true
      };

      // set _last variables
      $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
        '("exploration")&language_code=("en" OR "hi")')
        .respond(200, {
          search_cursor: 'notempty',
          activity_list: []
        });
      SearchService.executeSearchQuery(
        searchQuery, categories, languageCodes, successHandler);
      $httpBackend.flush();

      SearchService.loadMoreData(function() {}, function() {});

      var successHandler = jasmine.createSpy('sucess');
      var failHandler = jasmine.createSpy('fail');
      SearchService.loadMoreData(successHandler, failHandler);

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(false);
    });

  it('should not load more data when the end of page has been reached',
    function() {
      var successHandler = jasmine.createSpy('success');
      var searchQuery = 'example';
      var categories = {
        exploration: true
      };
      var languageCodes = {
        en: true,
        hi: true
      };

      // set _last variables
      $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
        '("exploration")&language_code=("en" OR "hi")')
        .respond(200, {
          search_cursor: 'notempty',
          activity_list: []
        });
      SearchService.executeSearchQuery(
        searchQuery, categories, languageCodes, successHandler);
      $httpBackend.flush();

      $httpBackend.expect('GET', '/searchhandler/data?q=example&category=' +
        '("exploration")&language_code=("en" OR "hi")&cursor=notempty')
        .respond(200, {
          search_cursor: null
        });
      SearchService.loadMoreData(function() {}, function() {});
      $httpBackend.flush();

      var successHandler = jasmine.createSpy('sucess');
      var failHandler = jasmine.createSpy('fail');
      SearchService.loadMoreData(successHandler, failHandler);

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(true);
    });
});
