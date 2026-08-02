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
 * @fileoverview Component for editing the featured ('Most needed')
 * translation languages shown on the Contributor Dashboard.
 */

import {Component, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {FeaturedTranslationLanguage} from 'domain/opportunity/featured-translation-language.model';

interface LanguageOption {
  id: string;
  description: string;
}

@Component({
  selector: 'oppia-featured-translation-languages-editor',
  templateUrl: './featured-translation-languages-editor.component.html',
})
export class FeaturedTranslationLanguagesEditorComponent implements OnInit {
  featuredLanguages: FeaturedTranslationLanguage[] = [];
  languageOptions: LanguageOption[] = [];
  availableLanguageOptions: LanguageOption[] = [];
  newLanguageCode: string = '';
  newExplanation: string = '';
  loadingMessage: string = '';
  saveInProgress: boolean = false;
  isEditorOpen: boolean = false;

  constructor(
    private contributorDashboardAdminBackendApiService: ContributorDashboardAdminBackendApiService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.languageOptions = AppConstants.SUPPORTED_AUDIO_LANGUAGES.map(lang => ({
      id: lang.id,
      description: lang.description,
    }));
    // Populate the dropdown immediately so it works even before (or without)
    // a successful load of the currently-configured languages.
    this.refreshAvailableLanguageOptions();
  }

  toggleEditor(): void {
    this.isEditorOpen = !this.isEditorOpen;
    // Lazy-load: fetch only when the admin opens the panel (avoids a failed
    // GET on every dashboard load, and allows a retry on re-open).
    if (this.isEditorOpen) {
      this.loadFeaturedTranslationLanguages();
    }
  }

  private loadFeaturedTranslationLanguages(): void {
    this.loadingMessage = 'Loading featured translation languages...';
    this.contributorDashboardAdminBackendApiService
      .getFeaturedTranslationLanguagesAsync()
      .then(
        featuredLanguages => {
          this.featuredLanguages = featuredLanguages;
          this.refreshAvailableLanguageOptions();
          this.loadingMessage = '';
        },
        errorMessage => {
          this.loadingMessage = '';
          this.alertsService.addWarning(
            errorMessage || 'Failed to load featured translation languages.'
          );
        }
      );
  }

  private refreshAvailableLanguageOptions(): void {
    const selectedCodes = this.featuredLanguages.map(
      language => language.languageCode
    );
    this.availableLanguageOptions = this.languageOptions.filter(
      option => !selectedCodes.includes(option.id)
    );
  }

  addFeaturedLanguage(): void {
    if (!this.newLanguageCode || !this.newExplanation.trim()) {
      return;
    }
    this.featuredLanguages.push(
      FeaturedTranslationLanguage.createFromBackendDict({
        language_code: this.newLanguageCode,
        explanation: this.newExplanation.trim(),
      })
    );
    this.newLanguageCode = '';
    this.newExplanation = '';
    this.refreshAvailableLanguageOptions();
  }

  removeFeaturedLanguage(index: number): void {
    this.featuredLanguages.splice(index, 1);
    this.refreshAvailableLanguageOptions();
  }

  saveFeaturedTranslationLanguages(): void {
    if (this.saveInProgress) {
      return;
    }
    this.saveInProgress = true;
    const payload = this.featuredLanguages.map(language => ({
      language_code: language.languageCode,
      explanation: language.explanation,
    }));
    this.contributorDashboardAdminBackendApiService
      .updateFeaturedTranslationLanguagesAsync(payload)
      .then(
        featuredLanguages => {
          this.featuredLanguages = featuredLanguages;
          this.refreshAvailableLanguageOptions();
          this.saveInProgress = false;
          this.alertsService.addSuccessMessage(
            'Featured translation languages saved.'
          );
        },
        errorMessage => {
          this.saveInProgress = false;
          this.alertsService.addWarning(
            errorMessage || 'Failed to save featured translation languages.'
          );
        }
      );
  }
}
