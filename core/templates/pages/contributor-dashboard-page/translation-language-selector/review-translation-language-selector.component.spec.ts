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
  tick,
  flush,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import {
  ReviewTranslationLanguageSelectorComponent,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/translation-language-selector/review-translation-language-selector.component';
import {
  ContributionOpportunitiesBackendApiService,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {UserService} from 'services/user.service';
import {ElementRef, EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {AppConstants} from 'app.constants';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Review Translation language selector', () => {
  let component: ReviewTranslationLanguageSelectorComponent;
  let fixture: ComponentFixture<ReviewTranslationLanguageSelectorComponent>;
  let translationLanguageService: TranslationLanguageService;
  let userService: UserService;
  const activeLanguageChangedEmitter = new EventEmitter();

  let preferredLanguageCode = 'en';

  const contributionOpportunitiesBackendApiServiceStub: Partial<ContributionOpportunitiesBackendApiService> =
    {
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
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [ReviewTranslationLanguageSelectorComponent],
      providers: [
        TranslationLanguageService,
        UserService,
        {
          provide: ContributionOpportunitiesBackendApiService,
          useValue: contributionOpportunitiesBackendApiServiceStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      ReviewTranslationLanguageSelectorComponent
    );
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    userService = TestBed.inject(UserService);
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
        .querySelector(
          '.oppia-review-translation-language-selector-inner-container'
        )
        .click();
      fixture.detectChanges();
      flush();
    };

    getDropdownOptionsContainer = () => {
      return fixture.debugElement.nativeElement.querySelector(
        '.oppia-review-translation-language-selector-dropdown-container'
      );
    };
  });

  afterEach(() => {
    preferredLanguageCode = 'en';
    component.activeLanguageCode = 'en';
  });

  describe('when reviewer translation rights are found', () => {
    const translationReviewerLanguageCodes = ['en', 'es', 'fr'];

    beforeEach(fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.resolveTo({
        can_suggest_questions: false,
        can_review_translation_for_language_codes:
          translationReviewerLanguageCodes,
        can_review_voiceover_for_language_codes: [],
        can_review_questions: false,
      });
      component.ngOnInit();
      tick();
      fixture.detectChanges();
    }));

    it(
      "should initialize languageIdToDescription map to user's reviewable " +
        'languages',
      () => {
        const reviewableLanguageDescriptions = {
          en: 'English',
          es: 'español (Spanish)',
          fr: 'français (French)',
        };

        expect(component.languageIdToDescription).toEqual(
          reviewableLanguageDescriptions
        );
      }
    );

    it('should initialize selected language to activeLanguageCode input', () => {
      const dropdown = fixture.nativeElement.querySelector(
        '.oppia-review-translation-language-selector-inner-container'
      );

      expect(dropdown.firstChild.textContent.trim()).toBe('English');
    });

    it(
      'should only show language options for which the user can review' +
        ' translations',
      () => {
        expect(component.options.map(opt => opt.id)).toEqual(
          translationReviewerLanguageCodes
        );
        expect(component.filteredOptions).toEqual(component.options);
      }
    );

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
    }));

    it(
      'should hide the dropdown when open and the user clicks outside' +
        ' the dropdown',
      () => {
        const fakeClickAwayEvent = new MouseEvent('click');
        Object.defineProperty(fakeClickAwayEvent, 'target', {
          value: document.createElement('div'),
        });
        component.dropdownShown = true;

        component.onDocumentClick(fakeClickAwayEvent);
        fixture.detectChanges();

        expect(component.dropdownShown).toBe(false);
        expect(getDropdownOptionsContainer()).toBeFalsy();
      }
    );

    it('should set active language code to selected option', () => {
      spyOn(component.setActiveLanguageCode, 'emit');

      component.selectOption('fr');
      fixture.detectChanges();

      expect(component.setActiveLanguageCode.emit).toHaveBeenCalledWith('fr');
    });

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
        component.languageSelection = 'Language';

        component.ngOnInit();

        fixture.detectChanges();
        expect(component.languageSelection).toBe('Language');
        expect(component.activeLanguageCode).toBe(null);
      })
    );

    it('should show the correct language when the language is changed', () => {
      expect(component.languageSelection).toBe('English');
      component.ngOnInit();
      spyOn(
        translationLanguageService,
        'getActiveLanguageCode'
      ).and.returnValue('fr');

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
      // Expect the full list of languages to be contained. Adding just 3 here
      // as the list of languages may grow overtime.
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

  describe('when the reviewer translation rights are not found', () => {
    it('should throw an error', fakeAsync(() => {
      spyOn(userService, 'getUserContributionRightsDataAsync').and.resolveTo(
        null
      );

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
    }));
  });
});
