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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslationLanguageSelectComponent } from
  './translation-language-select.component';
import { ContributionOpportunitiesBackendApiService } from
  '../services/contribution-opportunities-backend-api.service';
import { FeaturedTranslationLanguageFactory } from
  'domain/community_dashboard/FeaturedTranslationLanguageFactory';

/**
 * @fileoverview Unit tests for the translation language select
 */

describe('Translation language select', () => {
  let component: TranslationLanguageSelectComponent;
  let fixture: ComponentFixture<TranslationLanguageSelectComponent>;

  let featuredTranslationLanguageFactory =
    new FeaturedTranslationLanguageFactory();
  let featuredLanguages = [
    featuredTranslationLanguageFactory.createFromBackendDict({
      language_code: 'fr',
      description: 'Partnership with ABC'
    }),
    featuredTranslationLanguageFactory.createFromBackendDict({
      language_code: 'de',
      description: 'Partnership with CBA'
    })
  ];

  let contributionOpportunitiesBackendApiServiceStub:
    Partial<ContributionOpportunitiesBackendApiService> = {
      fetchFeaturedTranslationLanguages: () =>
        Promise.resolve(featuredLanguages)
    };

  let clickDropdown: () => void;
  let getDropdownOptionsContainer: () => HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TranslationLanguageSelectComponent],
      providers: [{
        provide: ContributionOpportunitiesBackendApiService,
        useValue: contributionOpportunitiesBackendApiServiceStub
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationLanguageSelectComponent);
    component = fixture.componentInstance;

    component.options = [
      { id: 'en', description: 'English' },
      { id: 'fr', description: 'French' },
      { id: 'sp', description: 'Spanish' },
      { id: 'de', description: 'German' }
    ];
    component.value = 'en';
    fixture.detectChanges();
  });

  beforeEach(() => {
    clickDropdown = () => {
      fixture.debugElement.nativeElement
        .querySelector('.oppia-translation-language-select-inner-container')
        .click();
      fixture.detectChanges();
    };

    getDropdownOptionsContainer = () => {
      return fixture.debugElement.nativeElement
        .querySelector('.oppia-translation-language-select-dropdown-container');
    };
  });

  it('should correctly initialize languageIdToDescription map', () => {
    expect(component.languageIdToDescription).toEqual({
      en: 'English',
      fr: 'French',
      sp: 'Spanish',
      de: 'German'
    });
  });

  it('should correctly fetch featured languages', async(() => {
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.featuredLanguages).toEqual(featuredLanguages);
    });
  }));

  it('should correctly initialize dropdown value', () => {
    const dropdown = (fixture.nativeElement
      .querySelector('.oppia-translation-language-select-inner-container'));

    expect(dropdown.firstChild.textContent.trim()).toEqual('English');
  });

  it('should correctly show and hide the dropdown', () => {
    expect(component.dropdownShown).toEqual(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toEqual(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    clickDropdown();
    expect(component.dropdownShown).toEqual(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();

    clickDropdown();
    expect(component.dropdownShown).toEqual(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    let fakeClickAwayEvent = new MouseEvent('click');
    Object.defineProperty(
      fakeClickAwayEvent,
      'target',
      {value: document.createElement('div')});
    component.onDocumentClick(fakeClickAwayEvent);
    fixture.detectChanges();
    expect(component.dropdownShown).toEqual(false);
    expect(getDropdownOptionsContainer()).toBeFalsy();
  });

  it('should correctly populate all options', async(() => {
    expect(component.dropdownShown).toEqual(false);
    expect(component.value).toEqual('en');

    clickDropdown();
    expect(component.dropdownShown).toEqual(true);
    expect(getDropdownOptionsContainer()).toBeTruthy();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      let allOptions = fixture.debugElement.nativeElement
        .querySelectorAll('.oppia-translation-language-select-dropdown-option');

      expect(allOptions.length).toEqual(6);
      expect(allOptions[0].firstChild.textContent.trim()).toEqual('French');
      expect(allOptions[1].firstChild.textContent.trim()).toEqual('German');
      expect(allOptions[2].firstChild.textContent.trim()).toEqual('English');
      expect(allOptions[3].firstChild.textContent.trim()).toEqual('French');
      expect(allOptions[4].firstChild.textContent.trim()).toEqual('Spanish');
      expect(allOptions[5].firstChild.textContent.trim()).toEqual('German');
    });
  }));

  it('should correctly select and indicate selection of an option', () => {
    spyOn(component.setValue, 'emit');

    component.selectOption('fr');
    fixture.detectChanges();

    expect(component.setValue.emit).toHaveBeenCalledWith('fr');
  });

  it('should show details of featured language', async(() => {
    clickDropdown();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      component.showDescriptionPopup(0);
      fixture.detectChanges();

      expect(component.descriptionPopupContent).toEqual('Partnership with ABC');
      expect(component.descriptionPopupShown).toEqual(true);

      component.hideDescriptionPopup();
      fixture.detectChanges();
      expect(component.descriptionPopupShown).toEqual(false);
    });
  }));
});
