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
 * @fileoverview Component for the Translation Configuration tab on the
 * Contributor Dashboard Admin page. Allows admins to map languages to
 * translation providers and toggle the master automatic translation flag.
 */

import {Component, OnInit} from '@angular/core';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslationProviderOption} from 'domain/contributor_dashboard/contributor-dashboard-admin-summary.model';
import {AlertsService} from 'services/alerts.service';

import './translation-configuration-tab.component.css';

interface LanguageOption {
  code: string;
  name: string;
}

@Component({
  selector: 'oppia-translation-configuration-tab',
  templateUrl: './translation-configuration-tab.component.html',
  styleUrls: ['./translation-configuration-tab.component.css'],
})
export class TranslationConfigurationTabComponent implements OnInit {
  providerMapping: Record<string, string> = {};
  isAutomaticTranslationEnabled: boolean = false;

  // All providers available in the static whitelist JSON.
  allAvailableProviders: TranslationProviderOption[] = [];

  // Subset of allAvailableProviders relevant for the currently selected language.
  availableProvidersForLanguage: TranslationProviderOption[] = [];

  // Cached list of languages not yet mapped to a provider, used in the
  // template via property binding (not a method call) to prevent Angular from
  // replacing all <option> elements on every change-detection cycle, which
  // would cause the browser to reset the displayed selection to the first item.
  unmappedLanguageOptions: LanguageOption[] = [];

  selectedLanguage: string = '';
  selectedProvider: string = '';

  constructor(
    private readonly apiService: ContributorDashboardAdminBackendApiService,
    private readonly languageUtilService: LanguageUtilService,
    private readonly alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    const config = await this.apiService.fetchTranslationConfigurationAsync();
    this.providerMapping = config.providerMapping;
    this.isAutomaticTranslationEnabled = config.automaticTranslationIsEnabled;
    this.allAvailableProviders = config.availableProviders;
    this.refreshUnmappedLanguageOptions();
  }

  getLanguageName(code: string): string {
    return this.languageUtilService.getAudioLanguageDescription(code) || code;
  }

  getProviderDisplayName(providerId: string): string {
    const match = this.allAvailableProviders.find(p => p.id === providerId);
    return match ? match.displayName : providerId;
  }

  // Recomputes and caches the list of languages not yet mapped to a provider.
  // Must be called whenever providerMapping changes so the template property
  // stays in sync without relying on a method call in the template.
  private refreshUnmappedLanguageOptions(): void {
    const allOppiaLanguages =
      this.languageUtilService.getAllVoiceoverLanguageCodes();

    this.unmappedLanguageOptions = allOppiaLanguages
      .filter(code => !(code in this.providerMapping))
      .map(code => ({
        code,
        name: this.getLanguageName(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onLanguageChange(): void {
    this.selectedProvider = '';
    // For now show all providers; in future can filter per language whitelist.
    this.availableProvidersForLanguage = this.allAvailableProviders;
  }

  async addMapping(): Promise<void> {
    if (!this.selectedLanguage || !this.selectedProvider) {
      return;
    }
    this.providerMapping = {
      ...this.providerMapping,
      [this.selectedLanguage]: this.selectedProvider,
    };
    this.selectedLanguage = '';
    this.selectedProvider = '';
    this.availableProvidersForLanguage = [];
    this.refreshUnmappedLanguageOptions();
    await this.saveConfiguration();
  }

  async removeMapping(languageCode: string): Promise<void> {
    const updated = {...this.providerMapping};
    delete updated[languageCode];
    this.providerMapping = updated;
    this.refreshUnmappedLanguageOptions();
    await this.saveConfiguration();
  }

  async toggleAutomaticTranslation(): Promise<void> {
    await this.saveConfiguration();
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await this.apiService.updateTranslationConfigurationAsync(
        this.providerMapping,
        this.isAutomaticTranslationEnabled
      );
      this.alertsService.addSuccessMessage('Configuration saved successfully.');
    } catch (error) {
      this.alertsService.addWarning(
        error.message || 'Failed to save configuration.'
      );
    }
  }
}
