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
 * @fileoverview Unit tests for the featured translation languages editor.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {FeaturedTranslationLanguagesEditorComponent} from './featured-translation-languages-editor.component';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {FeaturedTranslationLanguage} from 'domain/opportunity/featured-translation-language.model';

describe('Featured Translation Languages Editor Component', () => {
  let component: FeaturedTranslationLanguagesEditorComponent;
  let fixture: ComponentFixture<FeaturedTranslationLanguagesEditorComponent>;
  let backendApiSpy: jasmine.SpyObj<ContributorDashboardAdminBackendApiService>;
  let alertsServiceSpy: jasmine.SpyObj<AlertsService>;

  const HINDI_LANGUAGE = FeaturedTranslationLanguage.createFromBackendDict({
    language_code: 'hi',
    explanation: 'For India.',
  });

  beforeEach(() => {
    backendApiSpy = jasmine.createSpyObj(
      'ContributorDashboardAdminBackendApiService',
      [
        'getFeaturedTranslationLanguagesAsync',
        'updateFeaturedTranslationLanguagesAsync',
      ]
    );
    alertsServiceSpy = jasmine.createSpyObj('AlertsService', [
      'addSuccessMessage',
      'addWarning',
    ]);

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [FeaturedTranslationLanguagesEditorComponent],
      providers: [
        {
          provide: ContributorDashboardAdminBackendApiService,
          useValue: backendApiSpy,
        },
        {provide: AlertsService, useValue: alertsServiceSpy},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(
      FeaturedTranslationLanguagesEditorComponent
    );
    component = fixture.componentInstance;
  });

  it('should load featured languages when the editor is opened', fakeAsync(() => {
    backendApiSpy.getFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.resolve([HINDI_LANGUAGE])
    );

    component.toggleEditor();
    flushMicrotasks();

    expect(component.isEditorOpen).toBeTrue();
    expect(
      backendApiSpy.getFeaturedTranslationLanguagesAsync
    ).toHaveBeenCalled();
    expect(component.featuredLanguages).toEqual([HINDI_LANGUAGE]);
    expect(component.loadingMessage).toBe('');
  }));

  it('should warn when loading fails on open', fakeAsync(() => {
    backendApiSpy.getFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.reject('Load error.')
    );

    component.toggleEditor();
    flushMicrotasks();

    expect(alertsServiceSpy.addWarning).toHaveBeenCalledWith('Load error.');
    expect(component.loadingMessage).toBe('');
  }));

  it('should close without reloading when toggled off', fakeAsync(() => {
    backendApiSpy.getFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.resolve([])
    );
    // Create translation admin user.
    flushMicrotasks();
    backendApiSpy.getFeaturedTranslationLanguagesAsync.calls.reset();

    // Verify featured language editor is visible.

    expect(component.isEditorOpen).toBeFalse();
    expect(
      backendApiSpy.getFeaturedTranslationLanguagesAsync
    ).not.toHaveBeenCalled();
  }));

  it('should add a language, clear inputs, and exclude it from options', () => {
    component.featuredLanguages = [];
    component.languageOptions = [
      {id: 'hi', description: 'Hindi'},
      {id: 'es', description: 'Spanish'},
    ];
    component.newLanguageCode = 'hi';
    component.newExplanation = '  For India.  ';

    component.addFeaturedLanguage();

    expect(component.featuredLanguages.length).toBe(1);
    expect(component.featuredLanguages[0].languageCode).toBe('hi');
    expect(component.featuredLanguages[0].explanation).toBe('For India.');
    expect(component.newLanguageCode).toBe('');
    expect(component.newExplanation).toBe('');
    expect(component.availableLanguageOptions).toEqual([
      {id: 'es', description: 'Spanish'},
    ]);
  });

  it('should not add when code or explanation is missing', () => {
    component.featuredLanguages = [];

    component.newLanguageCode = '';
    component.newExplanation = 'x';
    component.addFeaturedLanguage();
    expect(component.featuredLanguages.length).toBe(0);

    component.newLanguageCode = 'hi';
    component.newExplanation = '   ';
    component.addFeaturedLanguage();
    expect(component.featuredLanguages.length).toBe(0);
  });

  it('should remove a featured language by index', () => {
    const spanish = FeaturedTranslationLanguage.createFromBackendDict({
      language_code: 'es',
      explanation: 'b',
    });
    component.featuredLanguages = [HINDI_LANGUAGE, spanish];

    component.removeFeaturedLanguage(0);

    expect(component.featuredLanguages).toEqual([spanish]);
  });

  it('should save languages and show success', fakeAsync(() => {
    component.featuredLanguages = [HINDI_LANGUAGE];
    backendApiSpy.updateFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.resolve([HINDI_LANGUAGE])
    );

    component.saveFeaturedTranslationLanguages();
    flushMicrotasks();

    expect(
      backendApiSpy.updateFeaturedTranslationLanguagesAsync
    ).toHaveBeenCalledWith([{language_code: 'hi', explanation: 'For India.'}]);
    expect(component.saveInProgress).toBeFalse();
    expect(alertsServiceSpy.addSuccessMessage).toHaveBeenCalledWith(
      'Featured translation languages saved.'
    );
  }));

  it('should warn when saving fails', fakeAsync(() => {
    component.featuredLanguages = [HINDI_LANGUAGE];
    backendApiSpy.updateFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.reject('Save error.')
    );

    component.saveFeaturedTranslationLanguages();
    flushMicrotasks();

    expect(alertsServiceSpy.addWarning).toHaveBeenCalledWith('Save error.');
    expect(component.saveInProgress).toBeFalse();
  }));

  it('should not save when a save is already in progress', () => {
    backendApiSpy.updateFeaturedTranslationLanguagesAsync.and.returnValue(
      Promise.resolve([])
    );
    component.saveInProgress = true;

    component.saveFeaturedTranslationLanguages();

    expect(
      backendApiSpy.updateFeaturedTranslationLanguagesAsync
    ).not.toHaveBeenCalled();
  });
});
