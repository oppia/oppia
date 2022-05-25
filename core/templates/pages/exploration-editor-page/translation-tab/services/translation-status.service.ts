// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that provides the translation status of state and
 * its components.
 */

import { Injectable } from '@angular/core';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { WrittenTranslations } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { TranslationLanguageService } from './translation-language.service';
import { TranslationTabActiveModeService } from './translation-tab-active-mode.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { AppConstants } from 'app.constants';
import { downgradeInjectable } from '@angular/upgrade/static';

interface AvailabilityStatus {
  available: boolean;
  needsUpdate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationStatusService {
  constructor(
    private translationLanguageService: TranslationLanguageService,
    private translationTabActiveModeService: TranslationTabActiveModeService,
    private explorationStatesService: ExplorationStatesService,
    private stateRecordedVoiceoversService: StateRecordedVoiceoversService,
    private stateWrittenTranslationsService: StateWrittenTranslationsService
  ) {}

  AUDIO_NEEDS_UPDATE_MESSAGE = ['Audio needs update!'];
  TRANSLATION_NEEDS_UPDATE_MESSAGE = ['Translation needs update!'];
  ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
  FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
  NO_ASSETS_AVAILABLE_COLOR = '#D14836';
  langCode = this.translationLanguageService.getActiveLanguageCode();
  stateNeedsUpdateWarnings = {};
  stateWiseStatusColor = {};
  explorationTranslationContentRequiredCount = 0;
  explorationVoiceoverContentRequiredCount = 0;
  explorationTranslationContentNotAvailableCount = 0;
  explorationVoiceoverContentNotAvailableCount = 0;

  _getVoiceOverStatus(
      recordedVoiceovers: RecordedVoiceovers,
      contentId: string
  ): AvailabilityStatus {
    let availabilityStatus = {
      available: false,
      needsUpdate: false,
    };
    let availableLanguages = recordedVoiceovers.getLanguageCodes(
      contentId);
    if (availableLanguages.indexOf(this.langCode) !== -1) {
      availabilityStatus.available = true;
      let audioTranslation = recordedVoiceovers.getVoiceover(
        contentId, this.langCode);
      availabilityStatus.needsUpdate = audioTranslation.needsUpdate;
    }
    return availabilityStatus;
  }

  _getTranslationStatus(
      writtenTranslations: WrittenTranslations,
      contentId: string
  ): AvailabilityStatus {
    let availabilityStatus = {
      available: false,
      needsUpdate: false,
    };
    this.langCode = this.translationLanguageService.getActiveLanguageCode();
    let availableLanguages = (
      writtenTranslations.getLanguageCodes(contentId));
    if (availableLanguages.indexOf(this.langCode) !== -1) {
      let writtenTranslation = (
        writtenTranslations.getWrittenTranslation(contentId, this.langCode));
      if (writtenTranslation.translation !== '') {
        availabilityStatus.available = true;
        availabilityStatus.needsUpdate = writtenTranslation.needsUpdate;
      }
    }
    return availabilityStatus;
  }

  _getContentAvailabilityStatus(
      stateName: string,
      contentId: string
  ): AvailabilityStatus {
    this.langCode = this.translationLanguageService.getActiveLanguageCode();
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      let writtenTranslations = (
        this.explorationStatesService.getWrittenTranslationsMemento(stateName));
      return this._getTranslationStatus(writtenTranslations, contentId);
    } else if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      let recordedVoiceovers = (
        this.explorationStatesService.getRecordedVoiceoversMemento(stateName));
      return this._getVoiceOverStatus(recordedVoiceovers, contentId);
    }
  }

  _getActiveStateContentAvailabilityStatus(
      contentId: string
  ): AvailabilityStatus {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      let writtenTranslations = this.stateWrittenTranslationsService.displayed;
      return this._getTranslationStatus(writtenTranslations, contentId);
    } else if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      let recordedVoiceovers = this.stateRecordedVoiceoversService.displayed;
      return this._getVoiceOverStatus(recordedVoiceovers, contentId);
    }
  }

  _computeAllStatesStatus(): void {
    this.stateNeedsUpdateWarnings = {};
    this.stateWiseStatusColor = {};
    this.explorationTranslationContentRequiredCount = 0;
    this.explorationVoiceoverContentRequiredCount = 0;
    this.explorationTranslationContentNotAvailableCount = 0;
    this.explorationVoiceoverContentNotAvailableCount = 0;
    if (this.explorationStatesService.isInitialized()) {
      this.explorationStatesService.getStateNames().forEach((stateName) => {
        let stateNeedsUpdate = false;
        let noTranslationCount = 0;
        let noVoiceoverCount = 0;
        let recordedVoiceovers = (
          this.explorationStatesService.getRecordedVoiceoversMemento(stateName)
        );
        let allContentIds = recordedVoiceovers.getAllContentIds();
        let interactionId = (
          this.explorationStatesService.getInteractionIdMemento(stateName));
        // This is used to prevent users from adding unwanted hints audio, as
        // of now we do not delete interaction.hints when a user deletes
        // interaction, so these hints audio are not counted in checking
        // status of a state.
        if (!interactionId ||
          INTERACTION_SPECS[interactionId].is_linear ||
          INTERACTION_SPECS[interactionId].is_terminal) {
          let contentIdToRemove = this._getContentIdListRelatedToComponent(
            AppConstants.COMPONENT_NAME_HINT, allContentIds);
          // Excluding default_outcome content status as default outcome's
          // content is left empty so the translation or voiceover is not
          // required.
          contentIdToRemove.push('default_outcome');
          allContentIds = allContentIds.filter((contentId) => {
            return contentIdToRemove.indexOf(contentId) < 0;
          });
        }

        this.explorationTranslationContentRequiredCount += allContentIds.length;

        // Rule inputs do not need voiceovers. To have an accurate
        // representation of the progress bar for voiceovers, we remove rule
        // input content ids.
        const ruleInputContentIds = this._getContentIdListRelatedToComponent(
          AppConstants.COMPONENT_NAME_RULE_INPUT, allContentIds);
        this.explorationVoiceoverContentRequiredCount += (
          allContentIds.length - ruleInputContentIds.length);
        if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
          allContentIds = allContentIds.filter((contentId) => {
            return ruleInputContentIds.indexOf(contentId) < 0;
          });
        }

        allContentIds.forEach((contentId) => {
          let availabilityStatus = this._getContentAvailabilityStatus(
            stateName, contentId);
          if (!availabilityStatus.available) {
            noTranslationCount++;
            if (
              contentId.indexOf(AppConstants.COMPONENT_NAME_RULE_INPUT) !== 0) {
              noVoiceoverCount++;
            }
          }
          if (availabilityStatus.needsUpdate) {
            if (
              this.translationTabActiveModeService.isTranslationModeActive()) {
              this.stateNeedsUpdateWarnings[stateName] = (
                this.TRANSLATION_NEEDS_UPDATE_MESSAGE);
              stateNeedsUpdate = true;
            } else {
              this.stateNeedsUpdateWarnings[stateName] = (
                this.AUDIO_NEEDS_UPDATE_MESSAGE);
              stateNeedsUpdate = true;
            }
          }
        });
        this.explorationTranslationContentNotAvailableCount += (
          noTranslationCount);
        this.explorationVoiceoverContentNotAvailableCount += noVoiceoverCount;
        if (noTranslationCount === 0 && !stateNeedsUpdate) {
          this.stateWiseStatusColor[stateName] = (
            this.ALL_ASSETS_AVAILABLE_COLOR);
        } else if (
          noTranslationCount === allContentIds.length && !stateNeedsUpdate) {
          this.stateWiseStatusColor[stateName] = this.NO_ASSETS_AVAILABLE_COLOR;
        } else {
          this.stateWiseStatusColor[stateName] = (
            this.FEW_ASSETS_AVAILABLE_COLOR);
        }
      });
    }
  }

  _getContentIdListRelatedToComponent(
      componentName: string,
      availableContentIds: string[]
  ): string[] {
    let contentIdList = [];

    if (availableContentIds.length > 0) {
      if (componentName === 'solution' || componentName === 'content') {
        contentIdList.push(componentName);
      } else {
        let searchKey = componentName + '_';
        availableContentIds.forEach((contentId) => {
          if (contentId.indexOf(searchKey) > -1) {
            contentIdList.push(contentId);
          }
        });

        if (componentName === 'feedback') {
          contentIdList.push('default_outcome');
        }
      }
    }
    return contentIdList;
  }

  _getActiveStateComponentStatus(componentName: string): string {
    let contentIdList = this._getContentIdListRelatedToComponent(
      componentName, this._getAvailableContentIds());
    let availableAudioCount = 0;
    if (contentIdList) {
      contentIdList.forEach((contentId) => {
        let availabilityStatus = this._getActiveStateContentAvailabilityStatus(
          contentId);
        if (availabilityStatus.available) {
          availableAudioCount++;
        }
      });
      if (contentIdList.length === availableAudioCount) {
        return this.ALL_ASSETS_AVAILABLE_COLOR;
      } else if (availableAudioCount === 0) {
        return this.NO_ASSETS_AVAILABLE_COLOR;
      } else {
        return this.FEW_ASSETS_AVAILABLE_COLOR;
      }
    }
  }

  _getAvailableContentIds(): string[] {
    let availableContentIds = [];
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      let writtenTranslations = this.stateWrittenTranslationsService.displayed;
      availableContentIds = writtenTranslations.getAllContentIds();
    } else if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      let recordedVoiceovers = this.stateRecordedVoiceoversService.displayed;
      availableContentIds = recordedVoiceovers.getAllContentIds();
    }

    return availableContentIds;
  }

  _getActiveStateComponentNeedsUpdateStatus(componentName: string): boolean {
    let contentIdList = this._getContentIdListRelatedToComponent(
      componentName, this._getAvailableContentIds());
    let contentId = null;
    if (contentIdList) {
      for (let index in contentIdList) {
        contentId = contentIdList[index];
        let availabilityStatus = this._getActiveStateContentAvailabilityStatus(
          contentId);
        if (availabilityStatus.needsUpdate) {
          return true;
        }
      }
    }
    return false;
  }

  _getActiveStateContentIdStatusColor(contentId: string): string {
    let availabilityStatus = this._getActiveStateContentAvailabilityStatus(
      contentId);
    if (availabilityStatus.available) {
      return this.ALL_ASSETS_AVAILABLE_COLOR;
    } else {
      return this.NO_ASSETS_AVAILABLE_COLOR;
    }
  }

  _getActiveStateContentIdNeedsUpdateStatus(contentId: string): boolean {
    let availabilityStatus = this._getActiveStateContentAvailabilityStatus(
      contentId);
    return availabilityStatus.needsUpdate;
  }

  _getExplorationContentRequiredCount(): number {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return this.explorationTranslationContentRequiredCount;
    } else if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      return this.explorationVoiceoverContentRequiredCount;
    }
  }

  _getExplorationContentNotAvailableCount(): number {
    if (this.translationTabActiveModeService.isTranslationModeActive()) {
      return this.explorationTranslationContentNotAvailableCount;
    } else if (this.translationTabActiveModeService.isVoiceoverModeActive()) {
      return this.explorationVoiceoverContentNotAvailableCount;
    }
  }

  refresh(): void {
    this._computeAllStatesStatus();
  }

  getAllStatesNeedUpdatewarning(): {} {
    return this.stateNeedsUpdateWarnings;
  }

  getExplorationContentRequiredCount(): number {
    return this._getExplorationContentRequiredCount();
  }

  getExplorationContentNotAvailableCount(): number {
    return this._getExplorationContentNotAvailableCount();
  }

  getAllStateStatusColors(): {} {
    return this.stateWiseStatusColor;
  }

  getActiveStateComponentStatusColor(componentName: string): string {
    return this._getActiveStateComponentStatus(componentName);
  }

  getActiveStateComponentNeedsUpdateStatus(componentName: string): boolean {
    return this._getActiveStateComponentNeedsUpdateStatus(componentName);
  }

  getActiveStateContentIdStatusColor(contentId: string): string {
    return this._getActiveStateContentIdStatusColor(contentId);
  }

  getActiveStateContentIdNeedsUpdateStatus(contentId: string): boolean {
    return this._getActiveStateContentIdNeedsUpdateStatus(contentId);
  }
}

angular.module('oppia').factory(
  'TranslationStatusService',
  downgradeInjectable(TranslationStatusService));
