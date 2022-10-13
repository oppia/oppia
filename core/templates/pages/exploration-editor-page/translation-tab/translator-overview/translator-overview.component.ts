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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { ExplorationLanguageCodeService } from 'pages/exploration-editor-page/services/exploration-language-code.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationStatusService } from '../services/translation-status.service';
import { TranslationTabActiveModeService } from '../services/translation-tab-active-mode.service';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';

@Component({
  selector: 'oppia-translator-overview',
  templateUrl: './translator-overview.component.html'
})
export class TranslatorOverviewComponent implements OnInit {
  @Input() isTranslationTabBusy: boolean;

  inTranslationMode: boolean;
  inVoiceoverMode: boolean;
  languageCode: string;
  numberOfRequiredAudio: number;
  numberOfAudioNotAvailable: number;
  VOICEOVER_MODE: string;
  TRANSLATION_MODE: string;
  allAudioLanguageCodes: string[];
  LAST_SELECTED_TRANSLATION_LANGUAGE: string;
  languageCodesAndDescriptions: { id: string; description: string}[];

  constructor(
    private explorationLanguageCodeService:
      ExplorationLanguageCodeService,
    private focusManagerService: FocusManagerService,
    private graphDataService: GraphDataService,
    private languageUtilService: LanguageUtilService,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveModeService: TranslationTabActiveModeService,
    private windowRef: WindowRef
  ) {}

  canShowTabModeSwitcher(): boolean {
    return (this.languageCode !== (
      this.explorationLanguageCodeService.displayed));
  }

  refreshDirectiveScope(): void {
    this.inTranslationMode = (
      this.translationTabActiveModeService.isTranslationModeActive());
    this.inVoiceoverMode = (
      this.translationTabActiveModeService.isVoiceoverModeActive());
    this.allAudioLanguageCodes = (
      this.languageUtilService.getAllVoiceoverLanguageCodes());

    if (this.inTranslationMode) {
      let index = this.allAudioLanguageCodes.indexOf(
         this.explorationLanguageCodeService.displayed as string);
      if (index !== -1) {
        this.allAudioLanguageCodes.splice(index, 1);
      }
    }

    this.languageCodesAndDescriptions = (
      this.allAudioLanguageCodes.map((languageCode) => {
        return {
          id: languageCode,
          description: (
            this.languageUtilService.getAudioLanguageDescription(
              languageCode))
        };
      }));
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
    this.numberOfRequiredAudio = this.translationStatusService
      .getExplorationContentRequiredCount();
    this.numberOfAudioNotAvailable = this.translationStatusService
      .getExplorationContentNotAvailableCount();

    let progressPercent = (
      100 - (
        this.numberOfAudioNotAvailable /
         this.numberOfRequiredAudio) * 100);

    return {width: progressPercent + '%', height: '100%'};
  }

  changeTranslationLanguage(): void {
    if (this.isTranslationTabBusy) {
      this.languageCode = this.windowRef.nativeWindow.localStorage.getItem(
        this.LAST_SELECTED_TRANSLATION_LANGUAGE);
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }
    this.translationLanguageService.setActiveLanguageCode(
      this.languageCode);
    this.translationStatusService.refresh();

    this.windowRef.nativeWindow.localStorage.setItem(
      this.LAST_SELECTED_TRANSLATION_LANGUAGE, this.languageCode);

    this.routerService.onCenterGraph.emit();
    this.graphDataService.updateGraphData.emit();
  }

  getTranslationProgressAriaLabel(): string {
    if (this.numberOfRequiredAudio -
       this.numberOfAudioNotAvailable === 1) {
      return (
        this.numberOfRequiredAudio -
         this.numberOfAudioNotAvailable + ' item translated out of ' +
         this.numberOfRequiredAudio + ' items');
    } else {
      return (
        this.numberOfRequiredAudio -
         this.numberOfAudioNotAvailable +
         ' items translated out of ' +
         this.numberOfRequiredAudio + ' items');
    }
  }

  ngOnInit(): void {
    this.LAST_SELECTED_TRANSLATION_LANGUAGE = (
      'last_selected_translation_lang');
    let prevLanguageCode = this.windowRef.nativeWindow.localStorage.getItem(
      this.LAST_SELECTED_TRANSLATION_LANGUAGE);
    let allAudioLanguageCodes = this.languageUtilService
      .getAllVoiceoverLanguageCodes();

    if (this.routerService.getActiveTabName() === 'translation') {
      this.focusManagerService.setFocus('audioTranslationLanguageCodeField');
    }
    this.VOICEOVER_MODE = 'Voiceover';
    this.TRANSLATION_MODE = 'Translate';

    this.languageCode =
       allAudioLanguageCodes.indexOf(prevLanguageCode) !== -1 ?
         prevLanguageCode : (
           ExplorationEditorPageConstants.DEFAULT_AUDIO_LANGUAGE);

    this.translationLanguageService.setActiveLanguageCode(
      this.languageCode);
    // We need to refresh the status service once the active language is
    // set.
    this.translationStatusService.refresh();
    this.inTranslationMode = false;
    this.inVoiceoverMode = false;
    this.refreshDirectiveScope();
  }
}

angular.module('oppia').directive('oppiaTranslatorOverview',
   downgradeComponent({
     component: TranslatorOverviewComponent
   }) as angular.IDirectiveFactory);
