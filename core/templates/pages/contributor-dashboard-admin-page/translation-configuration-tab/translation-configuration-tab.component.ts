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
 * @fileoverview Component for the Translation Configuration tab on the
 * Contributor Dashboard Admin page. Allows admins to map languages to
 * translation providers and toggle the master automatic translation flag.
 */

import {Component, OnInit} from '@angular/core';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

interface ProviderOption {
  id: string;
  display_name: string;
}

interface LanguageOption {
  code: string;
  name: string;
}

@Component({
  selector: 'oppia-translation-configuration-tab',
  templateUrl: './translation-configuration-tab.component.html',
})
export class TranslationConfigurationTabComponent implements OnInit {
  providerMapping: Record<string, string> = {};
  isAutomaticTranslationEnabled: boolean = false;

  // All providers available in the static whitelist JSON.
  allAvailableProviders: ProviderOption[] = [];

  // Subset of allAvailableProviders relevant for the currently selected language.
  availableProvidersForLanguage: ProviderOption[] = [];

  selectedLanguage: string = '';
  selectedProvider: string = '';

  constructor(
    private readonly apiService: ContributorDashboardAdminBackendApiService,
    private readonly languageUtilService: LanguageUtilService
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    const config = await this.apiService.fetchTranslationConfigurationAsync();
    this.providerMapping = config.provider_mapping;
    this.isAutomaticTranslationEnabled =
      config.automatic_translation_is_enabled;
    this.allAvailableProviders = config.available_providers;
  }

  getLanguageName(code: string): string {
    return this.languageUtilService.getAudioLanguageDescription(code) || code;
  }

  getProviderDisplayName(providerId: string): string {
    const match = this.allAvailableProviders.find(p => p.id === providerId);
    return match ? match.display_name : providerId;
  }

  // Returns available languages that are not yet mapped to a provider.
  // Derived from all providers' supported language codes.
  getUnmappedLanguageOptions(): LanguageOption[] {
    const allLangCodes = new Set<string>();
    // For now we don't have the full list of all whitelisted languages per provider from the backend in this component.
    // However, the language dropdown should ideally show Oppia's supported audio languages that are not yet mapped.
    const allOppiaLanguages =
      this.languageUtilService.getAllVoiceoverLanguageCodes();

    return allOppiaLanguages
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
    await this.saveConfiguration();
  }

  async removeMapping(languageCode: string): Promise<void> {
    const updated = {...this.providerMapping};
    delete updated[languageCode];
    this.providerMapping = updated;
    await this.saveConfiguration();
  }

  async toggleAutomaticTranslation(): Promise<void> {
    await this.saveConfiguration();
  }

  private async saveConfiguration(): Promise<void> {
    await this.apiService.updateTranslationConfigurationAsync(
      this.providerMapping,
      this.isAutomaticTranslationEnabled
    );
  }
}
