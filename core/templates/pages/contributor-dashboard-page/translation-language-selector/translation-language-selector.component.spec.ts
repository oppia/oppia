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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationLanguageSelectorComponent } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/translation-language-selector/translation-language-selector.component.ts';
import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service.ts';
import { FeaturedTranslationLanguage } from 'domain/opportunity/featured-translation-language.model';

describe('Translation language selector', () => {
  let component: TranslationLanguageSelectorComponent;
  let fixture: ComponentFixture<TranslationLanguageSelectorComponent>;

  let featuredLanguages = [
    FeaturedTranslationLanguage.createFromBackendDict({
      language_code: 'fr',
      explanation: 'Partnership with ABC'
    }),
    FeaturedTranslationLanguage.createFromBackendDict({
      language_code: 'de',
      explanation: 'Partnership with CBA'
    })
  ];

  let contributionOpportunitiesBackendApiServiceStub:
    Partial<ContributionOpportunitiesBackendApiService> = {
      fetchFeaturedTranslationLanguagesAsync: () =>
        Promise.resolve(featuredLanguages)
    };

  let clickDropdown: () => void;
  let getDropdownOptionsContainer: () => HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TranslationLanguageSelectorComponent],
      providers: [{
        provide: ContributionOpportunitiesBackendApiService,
        useValue: contributionOpportunitiesBackendApiServiceStub
      }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationLanguageSelectorComponent);
    component = fixture.componentInstance;
    component.activeLanguageCode = 'en';
    fixture.detectChanges();
  });

  beforeEach(() => {
    clickDropdown = () => {
      fixture.debugElement.nativeElement
        .querySelector('.oppia-translation-language-selector-inner-container')
        .click();
      fixture.detectChanges();
    };

    getDropdownOptionsContainer = () => {
      return fixture.debugElement.nativeElement.querySelector(
        '.oppia-translation-language-selector-dropdown-container');
    };
  });

  it('should correctly initialize languageIdToDescription map', () => {
    expect(component.languageIdToDescription.en).toBe('English');
    expect(component.languageIdToDescription.fr).toBe('French');
  });

  it('should correctly fetch featured languages', async(() => {
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.featuredLanguages).toEqual(featuredLanguages);
    });
  }));

  it('should correctly initialize dropdown activeLanguageCode', () => {
    const dropdown = (
      fixture.nativeElement.querySelector(
        '.oppia-translation-language-selector-inner-container'));

    expect(dropdown.firstChild.textContent.trim()).toBe('English');
  });

  it('should correctly show and hide the dropdown', () => {
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
    Object.defineProperty(
      fakeClickAwayEvent,
      'target',
      {value: document.createElement('div')});
    component.onDocumentClick(fakeClickAwayEvent);
    fixture.detectChanges();
    expect(component.dropdownShown).toBe(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();
  });

  it('should correctly select and indicate selection of an option', () => {
    spyOn(component.setActiveLanguageCode, 'emit');

    component.selectOption('fr');
    fixture.detectChanges();

    expect(component.setActiveLanguageCode.emit).toHaveBeenCalledWith('fr');
  });

  it('should show details of featured language', async(() => {
    clickDropdown();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      component.showExplanationPopup(0);
      fixture.detectChanges();

      expect(component.explanationPopupContent)
        .toBe('Partnership with ABC');
      expect(component.explanationPopupShown).toBe(true);

      component.hideExplanationPopup();
      fixture.detectChanges();
      expect(component.explanationPopupShown).toBe(false);
    });
  }));
});
