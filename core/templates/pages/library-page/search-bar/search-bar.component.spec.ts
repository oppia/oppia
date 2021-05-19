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
 * @fileoverview Unit tests for searchBar.
 */

import { EventEmitter, Component, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, TestBed}
  from '@angular/core/testing';
import { ConstructTranslationIdsService } from
  'services/construct-translation-ids.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SearchBarComponent } from 'pages/library-page/search-bar/search-bar.component'
import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlService } from 'services/contextual/url.service';
import { TranslateService } from 'services/translate.service';
import { NavigationService } from 'services/navigation.service';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}
class MockWindowRef {
  _window = {
    location: {
      _pathname: '',
      _href: '',
      get pathname(): string {
        return this._pathname;
      },
      set pathname(val: string) {
        this._pathname = val;
      },
      get href(): string {
        return this._href;
      },
      set href(val) {
        this._href = val;
      }
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('Search bar component', () => {
  let classroomBackendApiService = null;
  let constructTranslationIdsService = null;
  let i18nLanguageCodeService = null;
  let navigationService = null;
  let urlService = null;
  let translateService = null;
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let initTranslationEmitter = new EventEmitter();
  let preferredLanguageCodesLoadedEmitter = new EventEmitter();
  let mockWindow = null;
  let windowRef: WindowRef = null;

  beforeEach(() => {
    let windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [SearchBarComponent],
      providers: [
        { provide: WindowRef, useValue: windowRef }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(function() {
    fixture = TestBed.createComponent(SearchBarComponent);
      component = fixture.componentInstance;
    constructTranslationIdsService = TestBed.inject(
      ConstructTranslationIdsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    navigationService = TestBed.inject(NavigationService);
    urlService = TestBed.inject(UrlService);
    translateService = TestBed.inject(TranslateService);

    spyOnProperty(
      classroomBackendApiService,
      'onInitializeTranslation').and.returnValue(initTranslationEmitter);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded').and.returnValue(
      preferredLanguageCodesLoadedEmitter);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization',() => {
      expect(Object.keys(component.selectionDetails)).toContain('categories');
      expect(Object.keys(component.selectionDetails)).toContain('languageCodes');

      expect(component.translationData).toEqual({
        categoriesCount: 0,
        languagesCount: 0
      });
    });

  it('should get placeholder and button text translation when translation' +
    ' is initialized', () => {
    initTranslationEmitter.emit();

    expect(component.searchBarPlaceholder).toBe('I18N_LIBRARY_SEARCH_PLACEHOLDER');
    expect(component.categoryButtonText).toBe('I18N_LIBRARY_ALL_CATEGORIES');
    expect(component.languageButtonText).toBe('I18N_LIBRARY_ALL_LANGUAGES');
  });

  it('should search for all content in given languages', () => {
    expect(component.isSearchInProgress()).toBe(false);

    mockWindow.location.pathname = '/search/find';
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);
    expect(component.isSearchInProgress()).toBe(true);

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });
    expect(mockWindow.location.href).toBe(
      '/find?q=&language_code=(%22en%22%20OR%20%22es%22%20OR%20%22hi%22)');

    preferredLanguageCodesLoadedEmitter.emit(['en']);

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 2
    });
    expect(mockWindow.location.href).toBe(
      '/find?q=&language_code=(%22es%22%20OR%20%22hi%22)');
  });

  it('should filter and search content by categories, language and text when' +
    'changing language code', () => {
    var getUrlParamsSpy = spyOn(urlService, 'getUrlParams');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22mars%22&' +
      'category=("astronomy")&language_code=("pt")').respond({});
    getUrlParamsSpy.and.returnValue({q: 'mars'});
    mockWindow.location.pathname = '/search/find';
    mockWindow.location.search = (
      '?q=%22mars%22&language_code=(%22pt%22)&category=(%22astronomy%22)');
    preferredLanguageCodesLoadedEmitter.emit([]);

    expect(mockWindow.location.href).toBe(
      '/find?q=%22mars%22&category=(%22astronomy%22)&' +
      'language_code=(%22pt%22)');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22sun%22&category=("astronomy")&' +
      'language_code=("es")').respond({});
    mockWindow.location.pathname = '';
    mockWindow.location.search = (
      '?q=%22sun%22&language_code=(%22es%22)&category=(%22astronomy%22)');
    getUrlParamsSpy.and.returnValue({q: 'sun'});
    preferredLanguageCodesLoadedEmitter.emit([]);


    expect(mockWindow.location.href).toBe(
      '/search/find?q=%22sun%22&category=("astronomy")&language_code=("es")');
  });

  it('should filter and search content by categories, language and text' +
    ' when url location changes', () => {
    var getUrlParamsSpy = spyOn(urlService, 'getUrlParams');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22mars%22&' +
      'category=("astronomy")&language_code=("pt")').respond({});
    getUrlParamsSpy.and.returnValue({q: 'mars'});
    mockWindow.location.pathname = '/search/find';
    mockWindow.location.search = (
      '?q=%22mars%22&language_code=(%22pt%22)&category=(%22astronomy%22)');
    preferredLanguageCodesLoadedEmitter.emit([]);

    expect($location.url()).toBe(
      '/find?q=%22mars%22&category=(%22astronomy%22)&' +
        'language_code=(%22pt%22)');

    $httpBackend.expectGET(
      '/searchhandler/data?q=%22sun%22&category=("astronomy")&' +
      'language_code=("es")').respond({});
    mockWindow.location.pathname = '';
    mockWindow.location.search = (
      '?q=%22sun%22&language_code=(%22es%22)&category=(%22astronomy%22)');
    getUrlParamsSpy.and.returnValue({q: 'sun'});
    $rootScope.$broadcast('$locationChangeSuccess');
    $scope.$digest();

    expect(mockWindow.location.href).toBe(
      '/search/find?q=%22sun%22&category=("astronomy")&language_code=("es")');
  });

  it('should toggle select languages when searching content', () => {
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });

    component.toggleSelection('languageCodes', 'en');

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 2
    });

    component.toggleSelection('languageCodes', 'pt');

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });
  });

  it('should deselect all selected languages at once', () => {
    preferredLanguageCodesLoadedEmitter.emit(['en', 'es', 'hi']);

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 3
    });

    component.deselectAll('languageCodes');

    expect(component.translationData).toEqual({
      categoriesCount: 0,
      languagesCount: 0
    });
  });

  it('should open submenu and key down an action when clicking on language or' +
    ' category button', () => {
    spyOn(navigationService, 'onMenuKeypress');
    var event = new Event('click');
    component.openSubmenu(event, 'menuName');
    component.onMenuKeypress(event, 'menuName', {enter: 'open'});

    expect(navigationService.onMenuKeypress)
      .toHaveBeenCalledWith(event, 'menuName', {enter: 'open'});
    expect(component.activeMenuName).toBe('menuName');
  });
});
