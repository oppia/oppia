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

describe('Search service', function() {
  var SearchService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    SearchService = $injector.get('SearchService');
  }));

  it('should find two categories and two languages if given in url search',
    function() {
      var results = {
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
      var results = {
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
      var results = {
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
      var results = {
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
      var results = {
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
      var results = {
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
      var urlComponent = '?q=protractor%20test%26category=("Mathematics")' +
                         '%26language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test&category=("Mathematics")' +
                       '&language_code=("en" OR "ar")');
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should only find empty string when ampersand is not escaped anywhere',
    function() {
      var results = {
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
      var urlComponent = '?q=protractor&test&category=("Mathematics")' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error(
        'Invalid search query url: protractor&test&category=("Mathematics")' +
        '&language_code=("en"%20OR%20"ar")'));
    }
  );

  it('should error when category selection url component is malformed',
    function() {
      var results = {
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
      var urlComponent = '?q=protractor%20test&category=(("Mathematics")' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'categories: category=(("Mathematics")'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});

      var urlComponent = '?q=protractor%20test&category=("Mathematics"' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'categories: category=("Mathematics"'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should error when language selection url component is malformed',
    function() {
      var results = {
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
      var urlComponent = '?q=protractor%20test&category=("Mathematics")' +
                         '&language_code="en" OR "ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'languageCodes: language_code="en" OR "ar")'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });

      var urlComponent = '?q=protractor%20test&category=("Mathematics")' +
                         '&language_code="en" OR "ar"';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'languageCodes: language_code="en" OR "ar"'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );
});
