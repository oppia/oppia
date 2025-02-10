// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the translation overview and changing
 * translation language.
 */

import {Component, Input, OnInit} from '@angular/core';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {ExplorationLanguageCodeService} from 'pages/exploration-editor-page/services/exploration-language-code.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {TranslationTabActiveModeService} from '../services/translation-tab-active-mode.service';
import {ExplorationEditorPageConstants} from 'pages/exploration-editor-page/exploration-editor-page.constants';
import {ContextService} from 'services/context.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {LoaderService} from 'services/loader.service';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {
  ExplorationChangeEditTranslation,
  ExplorationChangeMarkTranslationsNeedsUpdate,
  ExplorationChangeMarkTranslationNeedsUpdateForLanguage,
  ExplorationChangeRemoveTranslations,
  ExplorationTranslationChange,
} from 'domain/exploration/exploration-draft.model';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {
  LanguageAccentMasterList,
  LanguageAccentToDescription,
  LanguageCodesMapping,
  VoiceoverBackendApiService,
} from 'domain/voiceover/voiceover-backend-api.service';
import {LocalStorageService} from 'services/local-storage.service';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';

@Component({
  selector: 'oppia-translator-overview',
  templateUrl: './translator-overview.component.html',
})
export class TranslatorOverviewComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isTranslationTabBusy!: boolean;

  inTranslationMode!: boolean;
  inVoiceoverMode!: boolean;
  languageCode!: string;
  numberOfRequiredAudio!: number;
  numberOfAudioNotAvailable!: number;
  VOICEOVER_MODE!: string;
  TRANSLATION_MODE!: string;
  allAudioLanguageCodes!: string[];
  LAST_SELECTED_TRANSLATION_LANGUAGE!: string;
  languageCodesAndDescriptions!: {id: string; description: string}[];
  languageAccentMasterList!: LanguageAccentMasterList;
  languageCodesMapping: LanguageCodesMapping = {};
  availableLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesLength: number = 0;
  selectedLanguageAccentCode: string = '';

  constructor(
    private contextService: ContextService,
    private entityTranslationsService: EntityTranslationsService,
    private entityVoiceoversService: EntityVoiceoversService,
    private changeListService: ChangeListService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private focusManagerService: FocusManagerService,
    private graphDataService: GraphDataService,
    private languageUtilService: LanguageUtilService,
    private loaderService: LoaderService,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveModeService: TranslationTabActiveModeService,
    private platformFeatureService: PlatformFeatureService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private localStorageService: LocalStorageService,
    private windowRef: WindowRef,
    private voiceoverPlayerService: VoiceoverPlayerService
  ) {}

  canShowTabModeSwitcher(): boolean {
    return (
      this.contextService.isExplorationLinkedToStory() &&
      this.languageCode !== this.explorationLanguageCodeService.displayed
    );
  }

  refreshDirectiveScope(): void {
    this.inTranslationMode =
      this.translationTabActiveModeService.isTranslationModeActive();
    this.inVoiceoverMode =
      this.translationTabActiveModeService.isVoiceoverModeActive();
    this.allAudioLanguageCodes =
      this.languageUtilService.getAllVoiceoverLanguageCodes();

    if (this.inTranslationMode) {
      let index = this.allAudioLanguageCodes.indexOf(
        this.explorationLanguageCodeService.displayed as string
      );
      if (index !== -1) {
        this.allAudioLanguageCodes.splice(index, 1);
      }
    }

    this.languageCodesAndDescriptions = this.allAudioLanguageCodes.map(
      languageCode => {
        return {
          id: languageCode,
          description:
            this.languageUtilService.getAudioLanguageDescription(languageCode),
        };
      }
    );
  }

  isVoiceoverContributionWithAccentEnabled(): boolean {
    return this.platformFeatureService.status.AddVoiceoverWithAccent.isEnabled;
  }

  changeActiveMode(modeName: string): void {
    if (modeName === this.VOICEOVER_MODE) {
      this.translationTabActiveModeService.activateVoiceoverMode();
    } else if (modeName === this.TRANSLATION_MODE) {
      this.translationTabActiveModeService.activateTranslationMode();
    }

    this.refreshDirectiveScope();
    this.translationStatusService.refresh();
    setTimeout(() => {
      this.graphDataService.recompute();
    });
  }

  getTranslationProgressStyle(): {
    width: string;
    height: string;
  } {
    this.numberOfRequiredAudio =
      this.translationStatusService.getExplorationContentRequiredCount();
    this.numberOfAudioNotAvailable =
      this.translationStatusService.getExplorationContentNotAvailableCount();

    let progressPercent =
      100 - (this.numberOfAudioNotAvailable / this.numberOfRequiredAudio) * 100;

    return {width: progressPercent + '%', height: '100%'};
  }

  changeTranslationLanguage(): void {
    if (this.isTranslationTabBusy) {
      let lastSelectedTranslationLanguage =
        this.windowRef.nativeWindow.localStorage.getItem(
          this.LAST_SELECTED_TRANSLATION_LANGUAGE
        );
      this.languageCode = lastSelectedTranslationLanguage
        ? lastSelectedTranslationLanguage
        : ExplorationEditorPageConstants.DEFAULT_AUDIO_LANGUAGE;
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }

    this.loaderService.showLoadingScreen('Loading');
    this.entityTranslationsService
      .getEntityTranslationsAsync(this.languageCode)
      .then(entityTranslations => {
        this.updateTranslationWithChangeList(entityTranslations);
        this.translationLanguageService.setActiveLanguageCode(
          this.languageCode
        );
        this.translationStatusService.refresh();
        this.windowRef.nativeWindow.localStorage.setItem(
          this.LAST_SELECTED_TRANSLATION_LANGUAGE,
          this.languageCode
        );
        this.routerService.onCenterGraph.emit();
        this.loaderService.hideLoadingScreen();
      });

    this.entityVoiceoversService.setLanguageCode(this.languageCode);
    this.localStorageService.setLastSelectedLanguageAccentCode('');
    this.entityVoiceoversService.fetchEntityVoiceovers().then(() => {
      this.updateLanguageAccentCodesDropdownOptions();
    });
  }

  getTranslationProgressAriaLabel(): string {
    if (this.numberOfRequiredAudio - this.numberOfAudioNotAvailable === 1) {
      return (
        this.numberOfRequiredAudio -
        this.numberOfAudioNotAvailable +
        ' item translated out of ' +
        this.numberOfRequiredAudio +
        ' items'
      );
    } else {
      return (
        this.numberOfRequiredAudio -
        this.numberOfAudioNotAvailable +
        ' items translated out of ' +
        this.numberOfRequiredAudio +
        ' items'
      );
    }
  }

  updateTranslationWithChangeList(entityTranslation: EntityTranslation): void {
    this.changeListService.getTranslationChangeList().forEach(changeDict => {
      changeDict = changeDict as ExplorationTranslationChange;
      switch (changeDict.cmd) {
        case 'edit_translation':
          changeDict = changeDict as ExplorationChangeEditTranslation;
          if (this.languageCode === changeDict.language_code) {
            entityTranslation.updateTranslation(
              changeDict.content_id,
              TranslatedContent.createFromBackendDict(changeDict.translation)
            );
          }
          break;
        case 'remove_translations':
          changeDict = changeDict as ExplorationChangeRemoveTranslations;
          entityTranslation.removeTranslation(changeDict.content_id);
          break;
        case 'mark_translations_needs_update':
          changeDict =
            changeDict as ExplorationChangeMarkTranslationsNeedsUpdate;
          entityTranslation.markTranslationAsNeedingUpdate(
            changeDict.content_id
          );
          break;
        case 'mark_translation_needs_update_for_language':
          changeDict =
            changeDict as ExplorationChangeMarkTranslationNeedsUpdateForLanguage;
          if (this.languageCode === changeDict.language_code) {
            entityTranslation.markTranslationAsNeedingUpdate(
              changeDict.content_id
            );
          }
      }
    });
  }

  ngOnInit(): void {
    this.LAST_SELECTED_TRANSLATION_LANGUAGE = 'last_selected_translation_lang';
    let lastSelectedTranslationLanguage =
      this.windowRef.nativeWindow.localStorage.getItem(
        this.LAST_SELECTED_TRANSLATION_LANGUAGE
      );
    let prevLanguageCode = lastSelectedTranslationLanguage
      ? lastSelectedTranslationLanguage
      : ExplorationEditorPageConstants.DEFAULT_AUDIO_LANGUAGE;
    let allAudioLanguageCodes =
      this.languageUtilService.getAllVoiceoverLanguageCodes();

    if (this.routerService.getActiveTabName() === 'translation') {
      this.focusManagerService.setFocus('audioTranslationLanguageCodeField');
    }
    this.VOICEOVER_MODE = 'Voiceover';
    this.TRANSLATION_MODE = 'Translate';

    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
    if (!this.languageCode) {
      this.languageCode =
        allAudioLanguageCodes.indexOf(prevLanguageCode) !== -1
          ? prevLanguageCode
          : ExplorationEditorPageConstants.DEFAULT_AUDIO_LANGUAGE;
    }

    this.entityTranslationsService
      .getEntityTranslationsAsync(this.languageCode)
      .then(entityTranslation => {
        this.updateTranslationWithChangeList(entityTranslation);
        this.translationLanguageService.setActiveLanguageCode(
          this.languageCode
        );
        // We need to refresh the status service once the active language is
        // set.
        this.translationStatusService.refresh();
        this.routerService.onCenterGraph.emit();

        this.inTranslationMode = false;
        this.inVoiceoverMode = false;
        this.refreshDirectiveScope();
      });
    this.entityVoiceoversService.setLanguageCode(this.languageCode);

    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(voiceoverLanguages => {
        this.languageAccentMasterList =
          voiceoverLanguages.languageAccentMasterList;
        this.languageCodesMapping = voiceoverLanguages.languageCodesMapping;
        this.updateLanguageAccentCodesDropdownOptions();
        this.voiceoverPlayerService.languageAccentMasterList =
          this.languageAccentMasterList;
        this.voiceoverPlayerService.setLanguageAccentCodesDescriptions(
          this.languageCode,
          this.entityVoiceoversService.getLanguageAccentCodes()
        );
        this.entityVoiceoversService.fetchEntityVoiceovers().then(() => {
          this.updateLanguageAccentCodesDropdownOptions();
        });
      });
  }

  updateLanguageAccentCodesDropdownOptions(): void {
    this.availableLanguageAccentCodesToDescriptions = {};
    this.supportedLanguageAccentCodesToDescriptions = {};
    this.supportedLanguageAccentCodesLength = 0;

    this.availableLanguageAccentCodesToDescriptions =
      this.languageAccentMasterList[this.languageCode];

    const supportedLanguageAccentCodes =
      this.languageCodesMapping[this.languageCode];

    for (let accentCode in supportedLanguageAccentCodes) {
      const description =
        this.availableLanguageAccentCodesToDescriptions[accentCode];
      this.supportedLanguageAccentCodesToDescriptions[accentCode] = description;
    }

    this.supportedLanguageAccentCodesLength = Object.keys(
      this.supportedLanguageAccentCodesToDescriptions
    ).length;

    if (this.supportedLanguageAccentCodesLength === 0) {
      this.selectedLanguageAccentCode = '';
      this.updateLanguageAccentCode(this.selectedLanguageAccentCode);
      return;
    }

    let firstLanguageAccentCode = Object.keys(
      this.supportedLanguageAccentCodesToDescriptions
    )[0];

    let lastSelectedLanguageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode() as string;

    if (
      lastSelectedLanguageAccentCode !== 'undefined' &&
      lastSelectedLanguageAccentCode !== ''
    ) {
      this.selectedLanguageAccentCode = lastSelectedLanguageAccentCode;
    } else {
      this.selectedLanguageAccentCode = firstLanguageAccentCode;
      this.localStorageService.setLastSelectedLanguageAccentCode(
        firstLanguageAccentCode
      );
    }
    this.updateLanguageAccentCode(this.selectedLanguageAccentCode);
  }

  updateLanguageAccentCode(languageAccentCode: string): void {
    this.selectedLanguageAccentCode = languageAccentCode;
    this.translationLanguageService.setActiveLanguageAccentCode(
      languageAccentCode
    );
  }
}
