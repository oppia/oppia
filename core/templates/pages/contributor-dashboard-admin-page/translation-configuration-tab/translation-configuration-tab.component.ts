import {Component, OnInit} from '@angular/core';
import {ContributorDashboardAdminBackendApiService} from '../services/contributor-dashboard-admin-backend-api.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

@Component({
  selector: 'oppia-translation-configuration-tab',
  templateUrl: './translation-configuration-tab.component.html',
})
export class TranslationConfigurationTabComponent implements OnInit {
  providerMapping: Record<string, string> = {};
  isAutomaticTranslationEnabled: boolean = false;

  providerWhitelist: Record<string, string[]> = {};
  availableLanguageCodes: string[] = [];
  availableProvidersForSelection: string[] = [];

  selectedLanguage: string = '';
  selectedProvider: string = '';

  constructor(
    private apiService: ContributorDashboardAdminBackendApiService,
    private languageUtilService: LanguageUtilService
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    const [config, whitelist] = await Promise.all([
      this.apiService.fetchTranslationConfigurationAsync(),
      this.apiService.fetchTranslationProviderWhitelistAsync(),
    ]);

    this.providerMapping = config.provider_mapping;
    this.isAutomaticTranslationEnabled =
      config.automatic_translation_is_enabled;

    this.providerWhitelist = whitelist;
    this.availableLanguageCodes = Object.keys(this.providerWhitelist);
  }

  async saveConfiguration(): Promise<void> {
    await this.apiService.updateTranslationConfigurationAsync(
      this.providerMapping,
      this.isAutomaticTranslationEnabled
    );
  }

  onLanguageSelectionChange(): void {
    this.selectedProvider = '';
    this.availableProvidersForSelection =
      this.providerWhitelist[this.selectedLanguage] || [];
  }

  getLanguageName(code: string): string {
    return this.languageUtilService.getAudioLanguageDescription(code) || code;
  }

  getProviderName(id: string): string {
    if (id === 'azure') return 'Azure Translator';
    if (id === 'gcp' || id === 'google') return 'Google Cloud Translate';
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  getUnmappedLanguageCodes(): string[] {
    return this.availableLanguageCodes.filter(
      langCode => !(langCode in this.providerMapping)
    );
  }

  async addMapping(): Promise<void> {
    if (!this.selectedLanguage || !this.selectedProvider) {
      return;
    }

    this.providerMapping[this.selectedLanguage] = this.selectedProvider;
    this.selectedLanguage = '';
    this.selectedProvider = '';
    this.availableProvidersForSelection = [];

    await this.saveConfiguration();
  }

  async removeMapping(languageCode: string): Promise<void> {
    delete this.providerMapping[languageCode];
    await this.saveConfiguration();
  }

  async toggleAutomaticTranslation(): Promise<void> {
    await this.saveConfiguration();
  }

  objectKeys = Object.keys;
}
