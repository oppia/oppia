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
 * @fileoverview Unit tests for ContributorAdminDashboardFilter model.
 */

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {TranslationConfigurationTabComponent} from './translation-configuration-tab.component';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslationAdminConfig} from 'domain/contributor_dashboard/contributor-dashboard-admin-summary.model';
import {AlertsService} from 'services/alerts.service';
import {FormsModule} from '@angular/forms';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('TranslationConfigurationTabComponent', () => {
  let component: TranslationConfigurationTabComponent;
  let fixture: ComponentFixture<TranslationConfigurationTabComponent>;
  let mockApiService: jasmine.SpyObj<ContributorDashboardAdminBackendApiService>;
  let mockLanguageUtilService: jasmine.SpyObj<LanguageUtilService>;
  let mockAlertsService: jasmine.SpyObj<AlertsService>;

  const MOCK_CONFIG = new TranslationAdminConfig({hi: 'azure'}, true, [
    {id: 'azure', displayName: 'Azure Translator'},
  ]);

  beforeEach(waitForAsync(() => {
    mockApiService = jasmine.createSpyObj(
      'ContributorDashboardAdminBackendApiService',
      [
        'fetchTranslationConfigurationAsync',
        'updateTranslationConfigurationAsync',
      ]
    );
    mockApiService.fetchTranslationConfigurationAsync.and.returnValue(
      Promise.resolve(MOCK_CONFIG)
    );
    mockApiService.updateTranslationConfigurationAsync.and.returnValue(
      Promise.resolve(MOCK_CONFIG)
    );

    mockLanguageUtilService = jasmine.createSpyObj('LanguageUtilService', [
      'getAudioLanguageDescription',
      'getAllVoiceoverLanguageCodes',
    ]);
    mockAlertsService = jasmine.createSpyObj('AlertsService', [
      'addSuccessMessage',
      'addWarning',
    ]);
    mockLanguageUtilService.getAudioLanguageDescription.and.callFake(
      (code: string) =>
        code === 'hi' ? 'Hindi' : code === 'es' ? 'Spanish' : code
    );
    mockLanguageUtilService.getAllVoiceoverLanguageCodes.and.returnValue([
      'hi',
      'es',
    ]);

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatSlideToggleModule,
        MatIconModule,
        MatCardModule,
      ],
      declarations: [TranslationConfigurationTabComponent],
      providers: [
        {
          provide: ContributorDashboardAdminBackendApiService,
          useValue: mockApiService,
        },
        {provide: LanguageUtilService, useValue: mockLanguageUtilService},
        {provide: AlertsService, useValue: mockAlertsService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationConfigurationTabComponent);
    component = fixture.componentInstance;
  });

  it('should load configuration on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(
      mockApiService.fetchTranslationConfigurationAsync
    ).toHaveBeenCalledTimes(1);
    expect(component.providerMapping).toEqual({hi: 'azure'});
    expect(component.isAutomaticTranslationEnabled).toBeTrue();
    expect(component.allAvailableProviders).toEqual([
      {id: 'azure', displayName: 'Azure Translator'},
    ]);
    // 'hi' is already mapped, so unmappedLanguageOptions should only show 'es'.
    expect(component.unmappedLanguageOptions).toEqual([
      {code: 'es', name: 'Spanish'},
    ]);
  }));

  it('should add a new language-provider mapping and save', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.selectedLanguage = 'es';
    component.selectedProvider = 'azure';
    component.addMapping();
    tick();

    expect(component.providerMapping).toEqual({hi: 'azure', es: 'azure'});
    expect(
      mockApiService.updateTranslationConfigurationAsync
    ).toHaveBeenCalledWith({hi: 'azure', es: 'azure'}, true);
    expect(component.selectedLanguage).toBe('');
    expect(component.selectedProvider).toBe('');
  }));

  it('should remove a mapping and save', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.removeMapping('hi');
    tick();

    expect(component.providerMapping).toEqual({});
    expect(
      mockApiService.updateTranslationConfigurationAsync
    ).toHaveBeenCalledWith({}, true);
  }));

  it('should toggle automatic translation and save', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.isAutomaticTranslationEnabled = false;
    component.toggleAutomaticTranslation();
    tick();

    expect(
      mockApiService.updateTranslationConfigurationAsync
    ).toHaveBeenCalledWith({hi: 'azure'}, false);
  }));

  it('should not add mapping if language or provider not selected', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.selectedLanguage = '';
    component.selectedProvider = 'azure';
    component.addMapping();
    tick();

    expect(
      mockApiService.updateTranslationConfigurationAsync
    ).not.toHaveBeenCalled();
  }));

  it('should not add mapping if provider not selected', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.selectedLanguage = 'es';
    component.selectedProvider = '';
    component.addMapping();
    tick();

    expect(
      mockApiService.updateTranslationConfigurationAsync
    ).not.toHaveBeenCalled();
  }));

  it('should get language name via languageUtilService', () => {
    expect(component.getLanguageName('hi')).toBe('Hindi');
    expect(
      mockLanguageUtilService.getAudioLanguageDescription
    ).toHaveBeenCalledWith('hi');
  });

  it('should fall back to language code if description is not available', () => {
    mockLanguageUtilService.getAudioLanguageDescription.and.returnValue(
      undefined
    );
    expect(component.getLanguageName('fr')).toBe('fr');
  });

  it('should get provider display name from available providers', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.getProviderDisplayName('azure')).toBe('Azure Translator');
    expect(component.getProviderDisplayName('unknown')).toBe('unknown');
  }));

  describe('language-specific providers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.allAvailableProviders = [
        {id: 'azure', displayName: 'Azure Translator'},
        {id: 'gcp', displayName: 'Google Cloud Translate'},
      ];
      // Test fixtures only; production support comes from the shared whitelist.
      component.languageProviderWhitelist = {
        hi: ['azure'],
        es: ['gcp'],
        fr: ['azure', 'gcp'],
      };
    }));

    const selectLanguage = (code: string): string[] => {
      component.selectedLanguage = code;
      component.onLanguageChange();
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.nativeElement.querySelector(
        '.e2e-test-provider-dropdown'
      );
      return Array.from(select.options)
        .map(option => option.value)
        .filter(value => value !== '');
    };

    it('should show only Azure for an Azure-only language', () => {
      expect(selectLanguage('hi')).toEqual(['azure']);
    });

    it('should show only GCP for a GCP-only language', () => {
      expect(selectLanguage('es')).toEqual(['gcp']);
    });

    it('should show both configured providers for a language supporting both', () => {
      expect(selectLanguage('fr')).toEqual(['azure', 'gcp']);
    });

    it('should clear the provider and update options when switching languages', () => {
      selectLanguage('hi');
      component.selectedProvider = 'azure';

      expect(selectLanguage('es')).toEqual(['gcp']);
      expect(component.selectedProvider).toBe('');
    });

    it('should show no providers and disable Add for an unsupported language', () => {
      expect(selectLanguage('ak')).toEqual([]);
      const addButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.e2e-test-add-mapping-btn'
      );
      expect(addButton.disabled).toBeTrue();
    });

    it('should show no providers when no language is selected', () => {
      expect(selectLanguage('')).toEqual([]);
    });

    it('should restore providers after switching to an unsupported language and back', fakeAsync(() => {
      mockLanguageUtilService.getAllVoiceoverLanguageCodes.and.returnValue([
        'hi',
        'es',
        'ak',
      ]);
      mockApiService.fetchTranslationConfigurationAsync.and.returnValue(
        Promise.resolve(
          new TranslationAdminConfig({}, true, component.allAvailableProviders)
        )
      );
      component.loadConfiguration();
      tick();
      fixture.detectChanges();

      const languageDropdown: HTMLSelectElement =
        fixture.nativeElement.querySelector('.e2e-test-language-dropdown');
      const providerDropdown: HTMLSelectElement =
        fixture.nativeElement.querySelector('.e2e-test-provider-dropdown');
      const addButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.e2e-test-add-mapping-btn'
      );
      const changeLanguage = (code: string): void => {
        languageDropdown.value = code;
        languageDropdown.dispatchEvent(new Event('change'));
        tick();
        fixture.detectChanges();
      };

      changeLanguage('hi');
      providerDropdown.value = 'azure';
      providerDropdown.dispatchEvent(new Event('change'));
      tick();
      fixture.detectChanges();
      expect(addButton.disabled).toBeFalse();

      changeLanguage('ak');
      expect(component.selectedProvider).toBe('');
      expect(providerDropdown.options.length).toBe(1);
      expect(addButton.disabled).toBeTrue();

      changeLanguage('hi');
      expect(
        Array.from(providerDropdown.options).map(option => option.value)
      ).toEqual(['', 'azure']);
      providerDropdown.value = 'azure';
      providerDropdown.dispatchEvent(new Event('change'));
      tick();
      fixture.detectChanges();
      expect(addButton.disabled).toBeFalse();
      expect(
        mockApiService.updateTranslationConfigurationAsync
      ).not.toHaveBeenCalled();
    }));
  });

  it('should populate unmappedLanguageOptions on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // 'hi' is already mapped, so only 'es' (Spanish) should appear.
    expect(component.unmappedLanguageOptions).toEqual([
      {code: 'es', name: 'Spanish'},
    ]);
  }));

  it('should remove a language from unmappedLanguageOptions after addMapping', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.selectedLanguage = 'es';
    component.selectedProvider = 'azure';
    component.addMapping();
    tick();

    // Both 'hi' and 'es' are now mapped, so the list should be empty.
    expect(component.unmappedLanguageOptions).toEqual([]);
  }));

  it('should add a language back to unmappedLanguageOptions after removeMapping', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.removeMapping('hi');
    tick();

    // 'hi' is unmapped again; both 'hi' (Hindi) and 'es' (Spanish) are available.
    expect(component.unmappedLanguageOptions).toEqual([
      {code: 'hi', name: 'Hindi'},
      {code: 'es', name: 'Spanish'},
    ]);
  }));

  it('should show warning if updating configuration fails', fakeAsync(() => {
    mockApiService.updateTranslationConfigurationAsync.and.returnValue(
      Promise.reject(new Error('Failed to update config.'))
    );

    component.providerMapping = {hi: 'azure'};
    component.isAutomaticTranslationEnabled = true;

    // Trigger save via toggle.
    component.toggleAutomaticTranslation();
    tick();

    expect(mockAlertsService.addWarning).toHaveBeenCalledWith(
      'Failed to update config.'
    );
  }));

  it('should show default warning if error has no message', fakeAsync(() => {
    mockApiService.updateTranslationConfigurationAsync.and.returnValue(
      Promise.reject({})
    );

    component.providerMapping = {hi: 'azure'};
    component.isAutomaticTranslationEnabled = true;

    component.toggleAutomaticTranslation();
    tick();

    expect(mockAlertsService.addWarning).toHaveBeenCalledWith(
      'Failed to save configuration.'
    );
  }));
});
