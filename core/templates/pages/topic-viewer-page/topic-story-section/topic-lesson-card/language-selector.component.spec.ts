// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LanguageSelectorComponent.
 */

import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {SimpleChange} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {LanguageSelectorComponent} from './language-selector.component';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let languageUtilService: jasmine.SpyObj<LanguageUtilService>;

  beforeEach(waitForAsync(() => {
    const languageUtilServiceSpy = jasmine.createSpyObj('LanguageUtilService', [
      'getContentLanguageDescription',
      'getAudioLanguageDescription',
      'getLanguageCodesRelatedToAudioLanguageCode',
    ]);

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LanguageSelectorComponent, MockTranslatePipe],
      providers: [
        {
          provide: LanguageUtilService,
          useValue: languageUtilServiceSpy,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    languageUtilService = TestBed.inject(
      LanguageUtilService
    ) as jasmine.SpyObj<LanguageUtilService>;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selectedTextLanguageCodeChange on text language change', () => {
    spyOn(component.selectedTextLanguageCodeChange, 'emit');

    component.onTextLanguageChange('fr');

    expect(component.selectedTextLanguageCode).toBe('fr');
    expect(component.selectedTextLanguageCodeChange.emit).toHaveBeenCalledWith(
      'fr'
    );
  });

  it('should emit null when empty string is passed to text language change', () => {
    spyOn(component.selectedTextLanguageCodeChange, 'emit');

    component.onTextLanguageChange('');

    expect(component.selectedTextLanguageCode).toBeNull();
    expect(component.selectedTextLanguageCodeChange.emit).toHaveBeenCalledWith(
      null
    );
  });

  it('should emit selectedVoiceoverLanguageCodeChange on voiceover language change', () => {
    spyOn(component.selectedVoiceoverLanguageCodeChange, 'emit');

    component.onVoiceoverLanguageChange('hi');

    expect(component.selectedVoiceoverLanguageCode).toBe('hi');
    expect(
      component.selectedVoiceoverLanguageCodeChange.emit
    ).toHaveBeenCalledWith('hi');
  });

  it('should clear selected voiceover language when it does not match selected text language', () => {
    spyOn(component.selectedVoiceoverLanguageCodeChange, 'emit');
    spyOn(component.selectedTextLanguageCodeChange, 'emit');
    component.availableVoiceoverLanguageCodes = ['en', 'pt-br'];
    component.selectedVoiceoverLanguageCode = 'en';

    component.onTextLanguageChange('pt');

    expect(component.selectedTextLanguageCodeChange.emit).toHaveBeenCalledWith(
      'pt'
    );
    expect(component.selectedVoiceoverLanguageCode).toBeNull();
    expect(
      component.selectedVoiceoverLanguageCodeChange.emit
    ).toHaveBeenCalledWith(null);
  });

  it('should emit null when empty string is passed to voiceover language change', () => {
    spyOn(component.selectedVoiceoverLanguageCodeChange, 'emit');

    component.onVoiceoverLanguageChange('');

    expect(component.selectedVoiceoverLanguageCode).toBeNull();
    expect(
      component.selectedVoiceoverLanguageCodeChange.emit
    ).toHaveBeenCalledWith(null);
  });

  it('should return no accents label when no matching voiceover options exist', () => {
    component.selectedTextLanguageCode = 'pt';
    component.availableVoiceoverLanguageCodes = ['en'];
    component.selectedVoiceoverLanguageCode = null;
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'pt', true),
      availableVoiceoverLanguageCodes: new SimpleChange([], ['en'], true),
    });

    expect(component.getSelectedVoiceoverLanguageLabel()).toBe(
      'I18N_LANGUAGE_SELECTOR_NO_ACCENTS_MESSAGE'
    );
    expect(component.shouldShowNoAccentsMessage()).toBeTrue();
  });

  it('should return true from hasVoiceoverLanguageOptions when voiceover languages exist', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us', 'hi'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us', 'hi'],
        true
      ),
    });

    expect(component.hasVoiceoverLanguageOptions()).toBeTrue();
  });

  it('should return false from hasVoiceoverLanguageOptions when no voiceover languages', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['hi'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange([], ['hi'], true),
    });

    expect(component.hasVoiceoverLanguageOptions()).toBeFalse();
  });

  it('should return filtered voiceover languages for selected text language', () => {
    component.selectedTextLanguageCode = 'pt';
    component.availableVoiceoverLanguageCodes = ['en', 'pt', 'pt-br', 'hi'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'pt', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'pt', 'pt-br', 'hi'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual(['pt', 'pt-br']);
  });

  it('should return empty filtered voiceover languages when text language is not selected', () => {
    component.selectedTextLanguageCode = null;
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange('en', null, false),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual([]);
  });

  it('should include voiceover languages matched via relatedLanguages', () => {
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.callFake(
      (code: string) => {
        if (code === 'fat') {
          return ['ak', 'fat'];
        }
        return [code];
      }
    );
    component.selectedTextLanguageCode = 'ak';
    component.availableVoiceoverLanguageCodes = ['ak', 'fat', 'en'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'ak', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['ak', 'fat', 'en'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual(['ak', 'fat']);
  });

  it('should include accent codes that use underscore separator', () => {
    component.selectedTextLanguageCode = 'ar';
    component.availableVoiceoverLanguageCodes = ['ar_iq', 'ar_jo', 'en'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'ar', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['ar_iq', 'ar_jo', 'en'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual([
      'ar_iq',
      'ar_jo',
    ]);
  });

  it('should ignore unknown accent codes in related language lookup without throwing', () => {
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.throwError(
      'Unknown language code'
    );
    component.selectedTextLanguageCode = 'ar';
    component.availableVoiceoverLanguageCodes = ['ar_iq', 'ar_jo'];
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'ar', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['ar_iq', 'ar_jo'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual([
      'ar_iq',
      'ar_jo',
    ]);
  });

  it('should show validation error when showValidationError is true and no text language selected', () => {
    component.showValidationError = true;
    component.selectedTextLanguageCode = null;

    expect(component.shouldShowTextLanguageValidationError()).toBeTrue();
  });

  it('should not show validation error when showValidationError is false', () => {
    component.showValidationError = false;
    component.selectedTextLanguageCode = null;

    expect(component.shouldShowTextLanguageValidationError()).toBeFalse();
  });

  it('should not show validation error when a text language is selected', () => {
    component.showValidationError = true;
    component.selectedTextLanguageCode = 'en';

    expect(component.shouldShowTextLanguageValidationError()).toBeFalse();
  });

  it('should return selected voiceover language code when it is valid', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = 'en';
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    expect(component.getValidSelectedVoiceoverLanguageCode()).toBe('en');
  });

  it('should return null from getValidSelectedVoiceoverLanguageCode when selected code is not in filtered list', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en-us'];
    component.selectedVoiceoverLanguageCode = 'pt';
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange([], ['en-us'], true),
    });

    expect(component.getValidSelectedVoiceoverLanguageCode()).toBeNull();
  });

  it('should return null from getValidSelectedVoiceoverLanguageCode when no voiceover is selected', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = null;
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    expect(component.getValidSelectedVoiceoverLanguageCode()).toBeNull();
  });

  it('should return content language description for language code', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('French');

    expect(component.getLanguageDescription('fr')).toBe('French');
    expect(
      languageUtilService.getContentLanguageDescription
    ).toHaveBeenCalledWith('fr');
  });

  it('should return backend accent description when available', () => {
    component.voiceoverLanguageAccentDescriptions = {
      'ar-IQ': 'Arabic (Iraq)',
    };

    expect(component.getLanguageDescription('ar-IQ')).toBe('Arabic (Iraq)');
  });

  it('should fall back to audio language description when content description is missing', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('');
    languageUtilService.getAudioLanguageDescription.and.returnValue(
      'French (Audio)'
    );

    expect(component.getLanguageDescription('fr')).toBe('French (Audio)');
    expect(
      languageUtilService.getAudioLanguageDescription
    ).toHaveBeenCalledWith('fr');
  });

  it('should return language code when no description is available', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('');
    languageUtilService.getAudioLanguageDescription.and.returnValue('');

    expect(component.getLanguageDescription('xyz')).toBe('xyz');
  });

  it('should return language code when audio description lookup throws', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('');
    languageUtilService.getAudioLanguageDescription.and.throwError(
      'Unknown language code'
    );

    expect(component.getLanguageDescription('ar_iq')).toBe('ar_iq');
  });

  it('should return description from getSelectedVoiceoverLanguageLabel when valid voiceover is selected', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue(
      'English (US)'
    );
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = 'en-us';
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    expect(component.getSelectedVoiceoverLanguageLabel()).toBe('English (US)');
  });

  it('should return Select from getSelectedVoiceoverLanguageLabel when no voiceover is selected but options exist', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = null;
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    expect(component.getSelectedVoiceoverLanguageLabel()).toBe(
      'I18N_LANGUAGE_SELECTOR_SELECT'
    );
  });

  it('should not clear voiceover on text language change when voiceover still matches filtered list', () => {
    spyOn(component.selectedVoiceoverLanguageCodeChange, 'emit');
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = 'en-us';
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    component.onTextLanguageChange('en');

    expect(component.selectedVoiceoverLanguageCode).toBe('en-us');
    expect(
      component.selectedVoiceoverLanguageCodeChange.emit
    ).not.toHaveBeenCalledWith(null);
  });

  it('should not clear voiceover on text language change when voiceover is null', () => {
    spyOn(component.selectedVoiceoverLanguageCodeChange, 'emit');
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];
    component.selectedVoiceoverLanguageCode = null;
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'en', true),
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['en', 'en-us'],
        true
      ),
    });

    component.onTextLanguageChange('en');

    expect(component.selectedVoiceoverLanguageCode).toBeNull();
    expect(
      component.selectedVoiceoverLanguageCodeChange.emit
    ).not.toHaveBeenCalledWith(null);
  });

  it('should not recompute filtered voiceover codes when ngOnChanges has unrelated changes', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en'];
    component.ngOnChanges({
      showValidationError: new SimpleChange(false, true, false),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual([]);
  });

  it('should recompute filtered voiceover codes when only availableVoiceoverLanguageCodes changes', () => {
    component.selectedTextLanguageCode = 'pt';
    component.availableVoiceoverLanguageCodes = ['pt', 'pt-br', 'en'];
    component.ngOnChanges({
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['pt', 'pt-br', 'en'],
        true
      ),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual(['pt', 'pt-br']);
  });

  it('should recompute filtered voiceover codes when only selectedTextLanguageCode changes', () => {
    component.availableVoiceoverLanguageCodes = ['en', 'pt'];
    component.selectedTextLanguageCode = 'pt';
    component.ngOnChanges({
      selectedTextLanguageCode: new SimpleChange(null, 'pt', true),
    });

    expect(component.filteredVoiceoverLanguageCodes).toEqual(['pt']);
  });
});
