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

import { EventEmitter, Pipe } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync}
  from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SearchBarComponent } from 'pages/library-page/search-bar/search-bar.component'
import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlService } from 'services/contextual/url.service';
import { NavigationService } from 'services/navigation.service';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { FormsModule } from '@angular/forms';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { TranslateService } from '@ngx-translate/core';
import { SearchService } from 'services/search.service';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '',
      href: '',
    },
    history: {
      pushState(data, title: string, url?: string | null) {}
    }
  };
}

class MockTranslateService {
  onLangChange: EventEmitter = new EventEmitter();

  instant(key: string | Array<string>, interpolateParams?: Object): string {
    return key;
  }
}

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Search bar component', () => {
  let classroomBackendApiService: ClassroomBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let navigationService: NavigationService;
  let searchService: SearchService;
  let windowRef: MockWindowRef;
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let initTranslationEmitter = new EventEmitter();
  let preferredLanguageCodesLoadedEmitter = new EventEmitter();
  let selectionDetails = {
    categories: {
      description: 'description',
      itemsName: 'categories',
      masterList: [
        {
          id: 'id_1',
          text: 'category 1'
        },
        {
          id: 'id_2',
          text: 'category 2'
        },
        {
          id: 'id_3',
          text: 'category 3'
        }
      ],
      selections: { id_1: true },
      numSelections: 0,
      summary: 'all categories'
    },
    languageCodes: {
      description: 'English',
      itemsName: 'languages',
      masterList: [],
      numSelections: 1,
      selections: {en: true},
      summary: 'English'
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [
        SearchBarComponent,
        MockTranslatePipe,
        MockTrunctePipe
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    navigationService = TestBed.inject(NavigationService);
    // urlService = TestBed.inject(UrlService);
    windowRef = TestBed.inject(WindowRef);
    spyOnProperty(
      classroomBackendApiService,
      'onInitializeTranslation').and.returnValue(initTranslationEmitter);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded').and.returnValue(
      preferredLanguageCodesLoadedEmitter);
    searchService = TestBed.inject(SearchService);
  });

  it ('should search', () => {
    component.classroomPageIsActive = true;
    const search = {
      target: {
        value: 'search'
      }
    };
    expect(component.searchToBeExec(search)).toBeNull();

    spyOn(component.searchQueryChanged, 'next');
    component.classroomPageIsActive = false;
    component.searchToBeExec(search);
    expect(component.searchQueryChanged.next).toHaveBeenCalled();
  });

  it ('should open submenu', () => {
    spyOn(navigationService, 'openSubmenu');
    component.openSubmenu(null, null);
    expect(navigationService.openSubmenu).toHaveBeenCalled();
  });

  it('should handle menu keypress', () => {
    spyOn(navigationService, 'onMenuKeypress');
    let activeMenuName = 'test_menu';
    navigationService.activeMenuName = activeMenuName;
    component.onMenuKeypress(null, null, null);
    expect(component.activeMenuName).toEqual(activeMenuName);
  });

  it('should update selection details', () => {
    component.selectionDetails = selectionDetails;
    component.updateSelectionDetails('categories');
    expect(component.selectionDetails.categories.numSelections).toEqual(1);
    component.updateSelectionDetails('languageCodes');
    expect(component.selectionDetails.languageCodes.description).toEqual(
      'I18N_LIBRARY_ALL_LANGUAGES_SELECTED');
  });

  it('should toggle selection', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'onSearchQueryChangeExec');
    component.selectionDetails = selectionDetails;
    component.toggleSelection('categories', 'id_1');
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  it('should deselectAll', () => {
    spyOn(component, 'updateSelectionDetails');
    spyOn(component, 'onSearchQueryChangeExec');
    component.selectionDetails = selectionDetails;
    component.deselectAll('categories');
    expect(component.selectionDetails.categories.selections).toEqual({});
    expect(component.updateSelectionDetails).toHaveBeenCalled();
    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  it('should handle search query change', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (
          searchQuery: string, categorySelections: object,
          languageCodeSelections: object, callb: () => void) => {
        callb();
      });
    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      'search_query');
    spyOn(windowRef.nativeWindow.history, 'pushState');
    windowRef.nativeWindow.location = new URL('http://localhost/search/find');
    component.selectionDetails = selectionDetails;

    component.onSearchQueryChangeExec();

    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();
    windowRef.nativeWindow.location = new URL('http://localhost/not/search/find');
    component.onSearchQueryChangeExec();
    expect(windowRef.nativeWindow.location.href).toEqual(
      '/search/find?q=search_query');
  });
});
