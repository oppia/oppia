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

import {SearchService} from './SearchService';
import {EventService} from './EventService';
import {LoggerService} from './LoggerService';
import {ErrorHandler} from '@angular/core';
import {HttpClient, HttpEvent, HttpHandler,
  HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  MissingTranslationHandler, MissingTranslationHandlerParams,
  TranslateCompiler,
  TranslateLoader,
  TranslateParser,
  TranslateService,
  TranslateStore
} from '@ngx-translate/core';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Search service', function() {
  var searchService: SearchService;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(() => {
    searchService = new SearchService(new EventService(),
      new LoggerService(new ErrorHandler()),
      new HttpClient(new class extends HttpHandler {
        handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
          return undefined;
        }
      }), new TranslateService(new TranslateStore(),
        new class extends TranslateLoader {
          getTranslation(lang: string): Observable<any> {
            return undefined;
          }
        }, new class extends TranslateCompiler {
          compile(value: string, lang: string): string | Function {
            return undefined;
          }

          compileTranslations(translations: any, lang: string): any {
          }
        }, new class extends TranslateParser {
          getValue(target: any, key: string): any {
          }

          interpolate(expr: string | Function, params?: any): string {
            return '';
          }
        }, new class extends MissingTranslationHandler {
          handle(params: MissingTranslationHandlerParams): any {
          }
        }));
  });


  it('should find two categories and two languages if given in url search',
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
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
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
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
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
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
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should find as many keywords as provided in search query',
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should not find languages nor categories when ampersand is escaped',
    () => {
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
      expect(searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test&category=("Mathematics")' +
                       '&language_code=("en" OR "ar")');
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should only use correct fields when ampersand is not escaped anywhere',
    () => {
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
      expect(
        searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('protractor');
      expect(results.languageCodes.selections).toEqual({
        en: true,
        ar: true
      });
      expect(results.categories.selections).toEqual({Mathematics: true});
    }
  );

  it('should omit url component if it is malformed',
    () => {
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
      // In the two cases below, language_code param is not wrapped in
      // parentheses. However, the category param is defined correctly.
      // updateSearchFieldsBasedOnUrlQuery is expected to clean language_code.
      var urlComponent = (
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar")');
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });

      var urlComponent = (
        '?q=protractor%20test&category=("Mathematics")&' +
        'language_code="en" OR "ar"');
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
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
      searchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );
});
