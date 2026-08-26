// Copyright 2024 The Oppia Authors. All Rights Reserved.
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

  const MOCK_CONFIG = {
    provider_mapping: {hi: 'azure'},
    automatic_translation_is_enabled: true,
    available_providers: [{id: 'azure', display_name: 'Azure Translator'}],
  };

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
      Promise.resolve()
    );

    mockLanguageUtilService = jasmine.createSpyObj('LanguageUtilService', [
      'getAudioLanguageDescription',
      'getAllVoiceoverLanguageCodes',
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
      {id: 'azure', display_name: 'Azure Translator'},
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

  it('should get language name via languageUtilService', () => {
    expect(component.getLanguageName('hi')).toBe('Hindi');
    expect(
      mockLanguageUtilService.getAudioLanguageDescription
    ).toHaveBeenCalledWith('hi');
  });

  it('should get provider display name from available providers', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.getProviderDisplayName('azure')).toBe('Azure Translator');
    expect(component.getProviderDisplayName('unknown')).toBe('unknown');
  }));

  it('should reset selected provider on language change', () => {
    component.selectedProvider = 'azure';
    component.allAvailableProviders = [
      {id: 'azure', display_name: 'Azure Translator'},
    ];
    component.onLanguageChange();

    expect(component.selectedProvider).toBe('');
    expect(component.availableProvidersForLanguage).toEqual([
      {id: 'azure', display_name: 'Azure Translator'},
    ]);
  });

  it('should get unmapped language options', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.getUnmappedLanguageOptions()).toEqual([
      {code: 'es', name: 'Spanish'},
    ]);
  }));
});
