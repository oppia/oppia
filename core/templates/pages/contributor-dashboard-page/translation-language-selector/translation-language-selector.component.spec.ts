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
 * @fileoverview Unit tests for the translation language selector component.
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import {
  TranslationLanguageSelectorComponent,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/translation-language-selector/translation-language-selector.component';
import {
  ContributionOpportunitiesBackendApiService,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {FeaturedTranslationLanguage} from 'domain/opportunity/featured-translation-language.model';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {ElementRef, EventEmitter} from '@angular/core';
import {AppConstants} from 'app.constants';
import {FormsModule} from '@angular/forms';

describe('Translation language selector', () => {
  let component: TranslationLanguageSelectorComponent;
  let fixture: ComponentFixture<TranslationLanguageSelectorComponent>;
  let translationLanguageService: TranslationLanguageService;
  let activeLanguageChangedEmitter = new EventEmitter();

  let featuredLanguages = [
    FeaturedTranslationLanguage.createFromBackendDict({
      language_code: 'fr',
      explanation: 'Partnership with ABC',
    }),
    FeaturedTranslationLanguage.createFromBackendDict({
      language_code: 'de',
      explanation: 'Partnership with CBA',
    }),
  ];
  let preferredLanguageCode = 'en';

  let contributionOpportunitiesBackendApiServiceStub: Partial<ContributionOpportunitiesBackendApiService> =
    {
      fetchFeaturedTranslationLanguagesAsync: async () =>
        Promise.resolve(featuredLanguages),
      getPreferredTranslationLanguageAsync: async () => {
        if (preferredLanguageCode) {
          component.populateLanguageSelection(preferredLanguageCode);
        }
        return Promise.resolve(preferredLanguageCode);
      },
      savePreferredTranslationLanguageAsync: async () => Promise.resolve(),
    };

  let clickDropdown: () => void;
  let getDropdownOptionsContainer: () => HTMLElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [TranslationLanguageSelectorComponent],
      providers: [
        {
          provide: ContributionOpportunitiesBackendApiService,
          useValue: contributionOpportunitiesBackendApiServiceStub,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationLanguageSelectorComponent);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    component = fixture.componentInstance;
    component.activeLanguageCode = 'en';
    spyOnProperty(
      translationLanguageService,
      'onActiveLanguageChanged'
    ).and.returnValue(activeLanguageChangedEmitter);
    fixture.detectChanges();
  });

  beforeEach(() => {
    clickDropdown = () => {
      fixture.debugElement.nativeElement
        .querySelector('.oppia-translation-language-selector-inner-container')
        .click();
      fixture.detectChanges();
      flush();
    };

    getDropdownOptionsContainer = () => {
      return fixture.debugElement.nativeElement.querySelector(
        '.oppia-translation-language-selector-dropdown-container'
      );
    };
  });

  afterEach(() => {
    preferredLanguageCode = 'en';
    component.activeLanguageCode = 'en';
  });

  it('should correctly initialize languageIdToDescription map', () => {
    expect(component.languageIdToDescription.en).toBe('English');
    expect(component.languageIdToDescription.fr).toBe('français (French)');
  });

  it('should correctly fetch featured languages', fakeAsync(() => {
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.featuredLanguages).toEqual(featuredLanguages);
    });
  }));

  it('should correctly initialize dropdown activeLanguageCode', () => {
    const dropdown = fixture.nativeElement.querySelector(
      '.oppia-translation-language-selector-inner-container'
    );

    expect(dropdown.firstChild.textContent.trim()).toBe('English');
  });

  it('should correctly show and hide the dropdown', fakeAsync(() => {
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toBe(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    clickDropdown();
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toBe(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    let fakeClickAwayEvent = new MouseEvent('click');
    Object.defineProperty(fakeClickAwayEvent, 'target', {
      value: document.createElement('div'),
    });
    component.onDocumentClick(fakeClickAwayEvent);
    fixture.detectChanges();
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();
  }));

  it('should correctly select and indicate selection of an option', () => {
    spyOn(component.setActiveLanguageCode, 'emit');

    component.selectOption('fr');
    fixture.detectChanges();

    expect(component.setActiveLanguageCode.emit).toHaveBeenCalledWith('fr');
  });

  it('should show details of featured language', fakeAsync(() => {
    clickDropdown();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      component.showExplanationPopup(0);
      fixture.detectChanges();

      expect(component.explanationPopupContent).toBe('Partnership with ABC');
      expect(component.explanationPopupShown).toBe(true);

      component.hideExplanationPopup();
      fixture.detectChanges();
      expect(component.explanationPopupShown).toBe(false);
    });
  }));

  it(
    'should display the selected language when the language is already' +
      ' selected',
    () => {
      component.activeLanguageCode = 'en';

      component.ngOnInit();

      expect(component.languageSelection).toBe('English');
      expect(component.activeLanguageCode).toBe('en');
    }
  );

  it(
    'should display the preferred language when the preferred' +
      ' language is defined',
    fakeAsync(() => {
      component.activeLanguageCode = null;
      component.languageSelection = '';
      preferredLanguageCode = 'en';
      const languageDescription =
        AppConstants.SUPPORTED_AUDIO_LANGUAGES.find(e => e.id === 'en')
          ?.description ?? '';

      spyOn(component.setActiveLanguageCode, 'emit').and.callFake(
        (languageCode: string) => {
          component.activeLanguageCode = languageCode;
        }
      );

      component.ngOnInit();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.setActiveLanguageCode.emit).toHaveBeenCalledWith(
          preferredLanguageCode
        );
        expect(component.activeLanguageCode).toBe(preferredLanguageCode);
        expect(component.languageSelection).toBe(languageDescription);
      });
    })
  );

  it(
    'should ask user to select a language when the preferred' +
      ' language is not defined',
    fakeAsync(() => {
      preferredLanguageCode = '';
      component.activeLanguageCode = null;
      component.languageSelection = '';

      component.ngOnInit();

      fixture.detectChanges();
      expect(component.languageSelection).toBe('Language');
      expect(component.activeLanguageCode).toBe(null);
    })
  );

  it('should show the correct language when the language is changed', () => {
    expect(component.languageSelection).toBe('English');
    component.ngOnInit();
    spyOn(translationLanguageService, 'getActiveLanguageCode').and.returnValue(
      'fr'
    );

    activeLanguageChangedEmitter.emit();

    expect(component.languageSelection).toBe('français (French)');
  });

  it(
    'should indicate selection and save the language' +
      ' on selecting a new language',
    () => {
      const selectedLanguage = 'fr';
      spyOn(component.setActiveLanguageCode, 'emit');
      spyOn(
        contributionOpportunitiesBackendApiServiceStub,
        'savePreferredTranslationLanguageAsync' as never
      );

      component.selectOption(selectedLanguage);

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.setActiveLanguageCode.emit).toHaveBeenCalledWith(
          selectedLanguage
        );
        expect(
          contributionOpportunitiesBackendApiServiceStub.savePreferredTranslationLanguageAsync
        ).toHaveBeenCalledWith(selectedLanguage);
      });
    }
  );

  it('should toggle dropdown', fakeAsync(() => {
    component.ngOnInit();
    component.filterDivRef = new ElementRef(document.createElement('div'));
    spyOn(component.filterDivRef.nativeElement, 'focus');

    expect(component.dropdownShown).toBe(false);
    expect(component.filteredOptions).toBe(component.options);

    // Open the dropdown.
    component.toggleDropdown();
    flush();

    expect(component.dropdownShown).toBe(true);
    expect(component.optionsFilter).toBe('');
    expect(component.filteredOptions).toBe(component.options);
    expect(component.filteredOptions).toContain({
      id: 'es',
      description: 'español (Spanish)',
    });
    expect(component.filteredOptions).toContain({
      id: 'fr',
      description: 'français (French)',
    });
    expect(component.filterDivRef.nativeElement.focus).toHaveBeenCalled();

    // Type a filter query.
    component.optionsFilter = 'sp';
    component.filterOptions();
    fixture.detectChanges();

    expect(component.filteredOptions).not.toBe(component.options);
    expect(component.filteredOptions).toContain({
      id: 'es',
      description: 'español (Spanish)',
    });
    expect(component.filteredOptions).not.toContain({
      id: 'fr',
      description: 'français (French)',
    });

    // Close the dropdown.
    component.toggleDropdown();
    flush();

    expect(component.dropdownShown).toBe(false);

    spyOn(component.filterDivRef.nativeElement, 'focus');

    // Open the dropdown.
    component.toggleDropdown();
    flush();

    expect(component.dropdownShown).toBe(true);
    expect(component.optionsFilter).toBe('');
    expect(component.filteredOptions).toBe(component.options);
    expect(component.filteredOptions).toContain({
      id: 'es',
      description: 'español (Spanish)',
    });
    expect(component.filteredOptions).toContain({
      id: 'fr',
      description: 'français (French)',
    });
    expect(component.filterDivRef.nativeElement.focus).toHaveBeenCalled();
  }));

  it('should filter language options based on the filter text', () => {
    component.ngOnInit();

    // Expect the full list of languages to be contained. Adding just 3 here as
    // the list of languages may grow overtime.
    expect(component.filteredOptions).toContain({
      id: 'en',
      description: 'English',
    });
    expect(component.filteredOptions).toContain({
      id: 'es',
      description: 'español (Spanish)',
    });
    expect(component.filteredOptions).toContain({
      id: 'fr',
      description: 'français (French)',
    });

    component.optionsFilter = 'sp';
    component.filterOptions();
    fixture.detectChanges();

    // Expect it to contain Spanish but not any of the other languages.
    expect(component.filteredOptions).toEqual([
      {id: 'es', description: 'español (Spanish)'},
    ]);
  });
});
