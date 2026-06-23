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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {LanguageSelectorComponent} from './language-selector.component';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let languageUtilService: jasmine.SpyObj<LanguageUtilService>;

  beforeEach(waitForAsync(() => {
    const languageUtilServiceSpy = jasmine.createSpyObj('LanguageUtilService', [
      'getContentLanguageDescription',
      'getAudioLanguageDescription',
    ]);

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LanguageSelectorComponent],
      providers: [
        {
          provide: LanguageUtilService,
          useValue: languageUtilServiceSpy,
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

    expect(component.getSelectedVoiceoverLanguageLabel()).toBe(
      'No accents available'
    );
    expect(component.shouldShowNoAccentsMessage()).toBeTrue();
  });

  it('should return true from hasVoiceoverLanguageOptions when voiceover languages exist', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['en', 'en-us', 'hi'];

    expect(component.hasVoiceoverLanguageOptions()).toBeTrue();
  });

  it('should return false from hasVoiceoverLanguageOptions when no voiceover languages', () => {
    component.selectedTextLanguageCode = 'en';
    component.availableVoiceoverLanguageCodes = ['hi'];

    expect(component.hasVoiceoverLanguageOptions()).toBeFalse();
  });

  it('should return filtered voiceover languages for selected text language', () => {
    component.selectedTextLanguageCode = 'pt';
    component.availableVoiceoverLanguageCodes = ['en', 'pt', 'pt-br', 'hi'];

    expect(component.filteredVoiceoverLanguageCodes).toEqual(['pt', 'pt-br']);
  });

  it('should return empty filtered voiceover languages when text language is not selected', () => {
    component.selectedTextLanguageCode = null;
    component.availableVoiceoverLanguageCodes = ['en', 'en-us'];

    expect(component.filteredVoiceoverLanguageCodes).toEqual([]);
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

  it('should return content language description for language code', () => {
    languageUtilService.getContentLanguageDescription.and.returnValue('French');

    expect(component.getLanguageDescription('fr')).toBe('French');
    expect(
      languageUtilService.getContentLanguageDescription
    ).toHaveBeenCalledWith('fr');
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
});
