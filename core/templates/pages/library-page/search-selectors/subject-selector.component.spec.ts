// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Subject Selector component.
 */

import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SubjectSelectorComponent} from 'pages/library-page/search-selectors/subject-selector.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {FormsModule} from '@angular/forms';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TranslateService} from '@ngx-translate/core';
import {MaterialModule} from 'modules/material.module';
import {SearchService} from 'services/search.service';
import {ConstructTranslationIdsService} from 'services/construct-translation-ids.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';

interface SearchDropDownCategories {
  id: string;
  text: string;
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

describe('subject-selector component', () => {
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let windowDimensionsService: WindowDimensionsService;
  let component: SubjectSelectorComponent;
  let searchService: SearchService;
  let constructTranslationIdsService: ConstructTranslationIdsService;
  let languageUtilService: LanguageUtilService;
  let modalService: NgbModal;
  let fixture: ComponentFixture<SubjectSelectorComponent>;
  let preferredLanguageCodesLoadedEmitter = new EventEmitter();
  let selectionDetailsStub: SelectionDetails;

  const searchDropdownCategories = (): SearchDropDownCategories[] => {
    return AppConstants.SEARCH_DROPDOWN_CATEGORIES.map(categoryName => {
      return {
        id: categoryName,
        text: constructTranslationIdsService.getLibraryId(
          'categories',
          categoryName
        ),
      };
    });
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, MaterialModule],
      declarations: [SubjectSelectorComponent, MockTranslatePipe],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        NgbModal,
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

    fixture = TestBed.createComponent(SubjectSelectorComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOnProperty(
      i18nLanguageCodeService,
      'onPreferredLanguageCodesLoaded'
    ).and.returnValue(preferredLanguageCodesLoadedEmitter);
    translateService = TestBed.inject(TranslateService);
    searchService = TestBed.inject(SearchService);
    modalService = TestBed.inject(NgbModal);
    languageUtilService = TestBed.inject(LanguageUtilService);
    constructTranslationIdsService = TestBed.inject(
      ConstructTranslationIdsService
    );
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
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

  it('should update selection details if there are no selections', () => {
    spyOn(translateService, 'instant').and.returnValue('key');
    component.updateSelectionDetails('categories');
    let selectionDetails = component.selectionDetails;
    expect(selectionDetails.categories.numSelections).toEqual(0);
  });

  it('should update selection details', () => {
    searchService.selectionDetails = selectionDetailsStub;
    component.updateSelectionDetails('categories');
    expect(component.selectionDetails).toEqual(selectionDetailsStub);
  });

  it('should initialize', () => {
    spyOn(component, 'updateSelectionDetails');
    component.ngOnInit();
    expect(component.updateSelectionDetails).toHaveBeenCalled();
  });

  it('should detect selections', () => {
    spyOn(component, 'updateSelectionDetails');

    searchService.selectionDetails = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: searchDropdownCategories(),
        numSelections: 0,
        selections: {},
        summary: '',
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: languageUtilService.getLanguageIdsAndTexts(),
        numSelections: 0,
        selections: {},
        summary: '',
      },
    };

    component.toggleSelection('categories', 'Algorithms');
    component.updateSelectionDetails('categories');
    expect(component.selectionDetails.categories.selections.Algorithms).toEqual(
      true
    );
    component.toggleSelection('categories', 'Algorithms');
    expect(component.selectionDetails.categories.selections.Algorithms).toEqual(
      false
    );
  });

  it('should contain "Algorithms" in categories masterList', () => {
    searchService.selectionDetails = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: searchDropdownCategories(),
        numSelections: 0,
        selections: {},
        summary: '',
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: languageUtilService.getLanguageIdsAndTexts(),
        numSelections: 0,
        selections: {},
        summary: '',
      },
    };

    const containsAlgorithms =
      component.selectionDetails.categories.masterList.some(
        category => category.id === 'Algorithms'
      );
    expect(containsAlgorithms).toBe(true);
  });

  it('should open modal subject selector', () => {
    spyOn(modalService, 'open');
    component.openSelectorModal();
    expect(modalService.open).toHaveBeenCalled();
  });
});
