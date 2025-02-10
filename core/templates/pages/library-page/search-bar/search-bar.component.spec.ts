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
 * @fileoverview Unit tests for Search bar.
 */

import {EventEmitter, Pipe} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SearchBarComponent} from 'pages/library-page/search-bar/search-bar.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {NavigationService} from 'services/navigation.service';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {FormsModule} from '@angular/forms';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TranslateService} from '@ngx-translate/core';
import {SearchService, SelectionDetails} from 'services/search.service';
import {ConstructTranslationIdsService} from 'services/construct-translation-ids.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {UrlService} from 'services/contextual/url.service';
import {Subject} from 'rxjs/internal/Subject';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/search/find',
      href: '',
      toString() {
        return 'http://localhost/test_path';
      },
    },
    history: {
      pushState(data: string, title: string, url?: string | null) {},
    },
  };
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();

  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockNavigationService {
  KEYBOARD_EVENT_TO_KEY_CODES = {
    enter: {
      shiftKeyIsPressed: false,
      keyCode: 13,
    },
    tab: {
      shiftKeyIsPressed: false,
      keyCode: 9,
    },
    shiftTab: {
      shiftKeyIsPressed: true,
      keyCode: 9,
    },
  };

  onMenuKeypress(): void {}

  openSubmenu(evt: KeyboardEvent, menuName: string): void {}

  ACTION_OPEN: string = 'open';
  ACTION_CLOSE: string = 'close';
}

describe('Search bar component', () => {
  let classroomBackendApiService: ClassroomBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let navigationService: NavigationService;
  let searchService: SearchService;
  let translateService: TranslateService;
  let languageUtilService: LanguageUtilService;
  let constructTranslationIdsService: ConstructTranslationIdsService;
  let windowRef: MockWindowRef;
  let windowDimensionsService: WindowDimensionsService;
  let urlService: UrlService;
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let initTranslationEmitter = new EventEmitter();
  let preferredLanguageCodesLoadedEmitter = new EventEmitter();
  let selectionDetailsStub: SelectionDetails;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [SearchBarComponent, MockTranslatePipe, MockTrunctePipe],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: NavigationService,
          useClass: MockNavigationService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    selectionDetailsStub = {
      categories: {
        description: 'description',
        itemsName: 'categories',
        masterList: [
          {
            id: 'id',
            text: 'category 1',
          },
          {
            id: 'id_2',
            text: 'category 2',
          },
          {
            id: 'id_3',
            text: 'category 3',
          },
        ],
        selections: {id: true, id_2: true, id_3: true},
        numSelections: 0,
        summary: 'all categories',
      },
      languageCodes: {
        description: 'English',
        itemsName: 'languages',
        masterList: [
          {
            id: 'en',
            text: 'English',
          },
          {
            id: 'es',
            text: 'Spanish',
          },
        ],
        numSelections: 1,
        selections: {en: true},
        summary: 'English',
      },
    };

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    navigationService = TestBed.inject(NavigationService);
    windowRef = TestBed.inject(WindowRef);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    spyOnProperty(
      classroomBackendApiService,
      'onInitializeTranslation'
    ).and.returnValue(initTranslationEmitter);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded'
    ).and.returnValue(preferredLanguageCodesLoadedEmitter);
    searchService = TestBed.inject(SearchService);
    translateService = TestBed.inject(TranslateService);
    constructTranslationIdsService = TestBed.inject(
      ConstructTranslationIdsService
    );
    languageUtilService = TestBed.inject(LanguageUtilService);
    urlService = TestBed.inject(UrlService);

    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should determine if mobile view is active', () => {
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(766);
    expect(component.isMobileViewActive()).toBe(true);
    windowWidthSpy.and.returnValue(1000);
    expect(component.isMobileViewActive()).toBe(false);
  });

  it('should determine if search button should be present', () => {
    spyOn(component, 'isMobileViewActive').and.returnValue(false);
    component.classroomPageIsActive = true;
    component.isSearchButtonActive();
    expect(component.searchButtonIsActive).toBe(true);

    component.classroomPageIsActive = false;
    component.isSearchButtonActive();
    expect(component.searchButtonIsActive).toBe(false);
  });

  it(
    'should update selection details if selected languages' +
      ' are greater than zero',
    () => {
      expect(component.selectionDetails.languageCodes.description).toEqual(
        'I18N_LIBRARY_ALL_LANGUAGES_SELECTED'
      );
      component.selectionDetails = selectionDetailsStub;
      spyOn(translateService, 'instant').and.returnValue('English');
      component.updateSelectionDetails('languageCodes');
      expect(component.selectionDetails.languageCodes.description).toEqual(
        'English'
      );
    }
  );

  it('should update selection details if there are no selections', () => {
    spyOn(translateService, 'instant').and.returnValue('key');
    component.updateSelectionDetails('categories');
    expect(component.selectionDetails.categories.numSelections).toEqual(0);
  });

  it('should search', () => {
    component.searchButtonIsActive = true;
    const search = {
      target: {
        value: 'search',
      },
    };
    component.searchToBeExec(search);

    spyOn(component.searchQueryChanged, 'next');
    component.searchButtonIsActive = false;
    component.searchToBeExec(search);
    expect(component.searchQueryChanged.next).toHaveBeenCalled();
  });

  it('should open submenu', () => {
    spyOn(navigationService, 'openSubmenu');
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'KeyboardEvent'." We need to suppress this error because of the
    // need to test validations. This throws an error only in the frontend
    // unit tests.
    // @ts-ignore
    component.openSubmenu(null, null);
    expect(navigationService.openSubmenu).toHaveBeenCalled();
  });

  it('should handle menu keypress', () => {
    spyOn(navigationService, 'onMenuKeypress');
    let activeMenuName = 'test_menu';
    navigationService.activeMenuName = activeMenuName;
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'KeyboardEvent'." We need to suppress this error because of the
    // need to test validations. This throws an error only in the frontend
    // unit tests.
    // @ts-ignore
    component.onMenuKeypress(null, null, null);
    expect(component.activeMenuName).toEqual(activeMenuName);
  });

  it('should toggle selection', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'refreshSearchBarLabels');
    component.toggleSelection('categories', 'id_1');
    component.toggleSelection('categories', 'id_1');
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.refreshSearchBarLabels).toHaveBeenCalled();
  });

  it('should deselectAll', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'refreshSearchBarLabels');
    component.deselectAll('categories');
    expect(component.selectionDetails.categories.selections).toEqual({});
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.refreshSearchBarLabels).toHaveBeenCalled();
  });

  it('should handle search query change with language param in URL', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (
        searchQuery: string,
        categorySelections: object,
        languageCodeSelections: object,
        callb: () => void
      ) => {
        callb();
      }
    );

    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      'search_query'
    );
    spyOn(windowRef.nativeWindow.history, 'pushState');

    component.searchQuery = 'test_query';

    windowRef.nativeWindow.location = new URL(
      'http://localhost/search/find?lang=en'
    );
    component.onSearchQueryChangeExec();

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();

    windowRef.nativeWindow.location = new URL(
      'http://localhost/not/search/find?lang=en'
    );
    component.onSearchQueryChangeExec();
    expect(windowRef.nativeWindow.location.href).toEqual(
      'http://localhost/search/find?q=search_query&lang=en'
    );
  });

  it(
    'should handle search query change with empty search query and ' +
      'language param in URL',
    () => {
      spyOn(searchService, 'executeSearchQuery');
      spyOn(searchService, 'getSearchUrlQueryString').and.returnValue('');
      spyOn(windowRef.nativeWindow.history, 'pushState');

      component.searchQuery = '';
      windowRef.nativeWindow.location = new URL(
        'http://localhost/not/search/find?lang=en'
      );
      component.onSearchQueryChangeExec();

      expect(windowRef.nativeWindow.history.pushState).not.toHaveBeenCalled();
      expect(windowRef.nativeWindow.location.href).toEqual(
        'http://localhost/not/search/find?lang=en'
      );
    }
  );

  it('should handle search query change without language param in URL', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (
        searchQuery: string,
        categorySelections: object,
        languageCodeSelections: object,
        callb: () => void
      ) => {
        callb();
      }
    );

    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      'search_query'
    );
    spyOn(windowRef.nativeWindow.history, 'pushState');

    component.searchQuery = 'test_query';

    windowRef.nativeWindow.location = new URL('http://localhost/search/find');
    component.onSearchQueryChangeExec();

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();

    windowRef.nativeWindow.location = new URL(
      'http://localhost/not/search/find'
    );
    component.onSearchQueryChangeExec();
    expect(windowRef.nativeWindow.location.href).toEqual(
      'http://localhost/search/find?q=search_query'
    );
  });

  it(
    'should handle search query change with empty query string ' +
      'and without language param in URL',
    () => {
      spyOn(searchService, 'executeSearchQuery');
      spyOn(searchService, 'getSearchUrlQueryString').and.returnValue('');
      spyOn(windowRef.nativeWindow.history, 'pushState');

      component.searchQuery = '';

      windowRef.nativeWindow.location = new URL('http://localhost/search/find');
      component.onSearchQueryChangeExec();

      expect(windowRef.nativeWindow.history.pushState).not.toHaveBeenCalled();
      expect(windowRef.nativeWindow.location.href).toEqual(
        'http://localhost/search/find'
      );

      windowRef.nativeWindow.history.pushState.calls.reset();

      windowRef.nativeWindow.location = new URL(
        'http://localhost/not/search/find'
      );
      component.onSearchQueryChangeExec();

      expect(windowRef.nativeWindow.history.pushState).not.toHaveBeenCalled();
      expect(windowRef.nativeWindow.location.href).toEqual(
        'http://localhost/not/search/find'
      );
    }
  );

  it('should update search fields based on url query', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      'test_query'
    );
    component.updateSearchFieldsBasedOnUrlQuery();
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  it('should refresh search bar labels', () => {
    let testLabel = 'test_label';
    spyOn(translateService, 'instant').and.returnValue(testLabel);
    component.refreshSearchBarLabels();
    expect(component.searchBarPlaceholder).toEqual(testLabel);
    expect(component.categoryButtonText).toEqual(testLabel);
    expect(component.languageButtonText).toEqual(testLabel);
  });

  it('should search dropdown categories', () => {
    spyOn(constructTranslationIdsService, 'getLibraryId');
    expect(component.searchDropdownCategories()).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(component, 'searchDropdownCategories').and.returnValue([]);
    spyOn(languageUtilService, 'getLanguageIdsAndTexts').and.returnValue([]);
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'refreshSearchBarLabels');
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
    spyOn(searchService.onSearchBarLoaded, 'emit');
    spyOn(
      i18nLanguageCodeService.onPreferredLanguageCodesLoaded,
      'subscribe'
    ).and.callFake((callb: (arg0: string[]) => void) => {
      callb(['en', 'es']);
      callb(['en', 'es']);
      return null;
    });
    spyOn(translateService.onLangChange, 'subscribe').and.callFake(callb => {
      callb();
      return null;
    });
    spyOn(
      classroomBackendApiService.onInitializeTranslation,
      'subscribe'
    ).and.callFake((callb: () => void) => {
      callb();
      return null;
    });
    spyOn(urlService, 'getUrlParams').and.returnValue({q: ''});
    component.searchQueryChanged = {
      pipe: (param1: string, parm2: string) => {
        return {
          subscribe(callb: () => void) {
            callb();
          },
        };
      },
    } as Subject<string>;
    component.ngOnInit();
    expect(component.searchDropdownCategories).toHaveBeenCalled();
    expect(languageUtilService.getLanguageIdsAndTexts).toHaveBeenCalled();
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.refreshSearchBarLabels).toHaveBeenCalled();
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
    expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
    expect(searchService.onSearchBarLoaded.emit).toHaveBeenCalled();
    expect(
      i18nLanguageCodeService.onPreferredLanguageCodesLoaded.subscribe
    ).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(
      classroomBackendApiService.onInitializeTranslation.subscribe
    ).toHaveBeenCalled();
    expect(urlService.getUrlParams).toHaveBeenCalled();
  });

  it('should tell searching status', () => {
    spyOn(searchService, 'isSearchInProgress').and.returnValue(false);
    expect(component.isSearchInProgress()).toBeFalse();
  });

  it('should open sub menu', () => {
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'KeyboardEvent'." We need to suppress this error because of the
    // need to test validations.
    // @ts-ignore
    component.openSubmenu(null, null);
  });
});
