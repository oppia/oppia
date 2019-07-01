// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-mode.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-written-translations.service.ts');

require('pages/exploration-editor-page/exploration-editor-page.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('TranslationStatusService', [
  'ExplorationStatesService', 'StateRecordedVoiceoversService',
  'StateWrittenTranslationsService', 'TranslationLanguageService',
  'TranslationTabActiveModeService', 'INTERACTION_SPECS', function(
      ExplorationStatesService, StateRecordedVoiceoversService,
      StateWrittenTranslationsService, TranslationLanguageService,
      TranslationTabActiveModeService, INTERACTION_SPECS) {
    var AUDIO_NEEDS_UPDATE_MESSAGE = ['Audio needs update!'];
    var TRANSLATION_NEEDS_UPDATE_MESSAGE = ['Translation needs update!'];
    var ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
    var FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
    var NO_ASSETS_AVAILABLE_COLOR = '#D14836';

    var langCode = TranslationLanguageService.getActiveLanguageCode();
    var stateNeedsUpdateWarnings = {};
    var stateWiseStatusColor = {};
    var explorationContentRequiredCount = 0;
    var explorationContentNotAvailableCount = 0;
    var recordedVoiceovers = StateRecordedVoiceoversService.displayed;

    var _getVoiceOverStatus = function(recordedVoiceovers, contentId) {
      var availabilityStatus = {
        available: false,
        needsUpdate: false,
      };
      var availableLanguages = recordedVoiceovers.getVoiceoverLanguageCodes(
        contentId);
      if (availableLanguages.indexOf(langCode) !== -1) {
        availabilityStatus.available = true;
        var audioTranslation = recordedVoiceovers.getVoiceover(
          contentId, langCode);
        availabilityStatus.needsUpdate = audioTranslation.needsUpdate;
      }
      return availabilityStatus;
    };

    var _getTranslationStatus = function(writtenTranslations, contentId) {
      var availabilityStatus = {
        available: false,
        needsUpdate: false,
      };
      langCode = TranslationLanguageService.getActiveLanguageCode();
      var availableLanguages = (
        writtenTranslations.getTranslationsLanguageCodes(contentId));
      if (availableLanguages.indexOf(langCode) !== -1) {
        var writtenTranslation = (
          writtenTranslations.getWrittenTranslation(contentId, langCode));
        if (writtenTranslation.getHtml() !== '') {
          availabilityStatus.available = true;
          availabilityStatus.needsUpdate = writtenTranslation.needsUpdate;
        }
      }
      return availabilityStatus;
    };
    var _getContentAvailabilityStatus = function(stateName, contentId) {
      langCode = TranslationLanguageService.getActiveLanguageCode();
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        var writtenTranslations = (
          ExplorationStatesService.getWrittenTranslationsMemento(stateName));
        return _getTranslationStatus(writtenTranslations, contentId);
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        var recordedVoiceovers = (
          ExplorationStatesService.getRecordedVoiceoversMemento(stateName));
        return _getVoiceOverStatus(recordedVoiceovers, contentId);
      }
    };

    var _getActiveStateContentAvailabilityStatus = function(contentId) {
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        var writtenTranslations = StateWrittenTranslationsService.displayed;
        return _getTranslationStatus(writtenTranslations, contentId);
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        var recordedVoiceovers = StateRecordedVoiceoversService.displayed;
        return _getVoiceOverStatus(recordedVoiceovers, contentId);
      }
    };

    var _computeAllStatesStatus = function() {
      stateNeedsUpdateWarnings = {};
      stateWiseStatusColor = {};
      explorationContentRequiredCount = 0;
      explorationContentNotAvailableCount = 0;

      if (ExplorationStatesService.isInitialized()) {
        ExplorationStatesService.getStateNames().forEach(function(stateName) {
          var noTranslationCount = 0;
          var recordedVoiceovers = (
            ExplorationStatesService.getRecordedVoiceoversMemento(stateName));
          var allContentId = recordedVoiceovers.getAllContentId();
          var interactionId = ExplorationStatesService.getInteractionIdMemento(
            stateName);
          // This is used to prevent users from adding unwanted hints audio, as
          // of now we do not delete interaction.hints when a user deletes
          // interaction, so these hints audio are not counted in checking
          // status of a state.
          if (!interactionId ||
            INTERACTION_SPECS[interactionId].is_linear ||
            INTERACTION_SPECS[interactionId].is_terminal) {
            allContentId = ['content'];
          }
          explorationContentRequiredCount += allContentId.length;
          allContentId.forEach(function(contentId) {
            var availabilityStatus = _getContentAvailabilityStatus(
              stateName, contentId);
            if (!availabilityStatus.available) {
              noTranslationCount++;
            }
            if (availabilityStatus.needsUpdate) {
              if (TranslationTabActiveModeService.isTranslationModeActive()) {
                stateNeedsUpdateWarnings[stateName] = (
                  TRANSLATION_NEEDS_UPDATE_MESSAGE);
              } else {
                stateNeedsUpdateWarnings[stateName] = (
                  AUDIO_NEEDS_UPDATE_MESSAGE);
              }
            }
          });
          explorationContentNotAvailableCount += noTranslationCount;
          if (noTranslationCount === 0) {
            stateWiseStatusColor[stateName] = ALL_ASSETS_AVAILABLE_COLOR;
          } else if (noTranslationCount === allContentId.length) {
            stateWiseStatusColor[stateName] = NO_ASSETS_AVAILABLE_COLOR;
          } else {
            stateWiseStatusColor[stateName] = FEW_ASSETS_AVAILABLE_COLOR;
          }
        });
      }
    };

    var _getContentIdListRelatedToComponent = function(componentName) {
      var contentIdList = [];
      var availableContentIds = [];

      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        var writtenTranslations = StateWrittenTranslationsService.displayed;
        availableContentIds = writtenTranslations.getAllContentId();
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        var recordedVoiceovers = StateRecordedVoiceoversService.displayed;
        availableContentIds = recordedVoiceovers.getAllContentId();
      }

      if (availableContentIds.length > 0) {
        if (componentName === 'solution' || componentName === 'content') {
          contentIdList.push(componentName);
        } else {
          var searchKey = componentName + '_';
          availableContentIds.forEach(function(contentId) {
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
    };

    var _getActiveStateComponentStatus = function(componentName) {
      var contentIdList = _getContentIdListRelatedToComponent(componentName);
      var availableAudioCount = 0;
      if (contentIdList) {
        contentIdList.forEach(function(contentId) {
          var availabilityStatus = _getActiveStateContentAvailabilityStatus(
            contentId);
          if (availabilityStatus.available) {
            availableAudioCount++;
          }
        });
        if (contentIdList.length === availableAudioCount) {
          return ALL_ASSETS_AVAILABLE_COLOR;
        } else if (availableAudioCount === 0) {
          return NO_ASSETS_AVAILABLE_COLOR;
        } else {
          return FEW_ASSETS_AVAILABLE_COLOR;
        }
      }
    };

    var _getActiveStateComponentNeedsUpdateStatus = function(componentName) {
      var contentIdList = _getContentIdListRelatedToComponent(componentName);
      var contentId = null;
      if (contentIdList) {
        for (var index in contentIdList) {
          contentId = contentIdList[index];
          var availabilityStatus = _getActiveStateContentAvailabilityStatus(
            contentId);
          if (availabilityStatus.needsUpdate) {
            return true;
          }
        }
      }
      return false;
    };

    var _getActiveStateContentIdStatusColor = function(contentId) {
      var availabilityStatus = _getActiveStateContentAvailabilityStatus(
        contentId);
      if (availabilityStatus.available) {
        return ALL_ASSETS_AVAILABLE_COLOR;
      } else {
        return NO_ASSETS_AVAILABLE_COLOR;
      }
    };

    var _getActiveStateContentIdNeedsUpdateStatus = function(contentId) {
      var availabilityStatus = _getActiveStateContentAvailabilityStatus(
        contentId);
      return availabilityStatus.needsUpdate;
    };

    return {
      refresh: function() {
        _computeAllStatesStatus();
      },
      getAllStatesNeedUpdatewarning: function() {
        return stateNeedsUpdateWarnings;
      },
      getExplorationContentRequiredCount: function() {
        return explorationContentRequiredCount;
      },
      getExplorationContentNotAvailableCount: function() {
        return explorationContentNotAvailableCount;
      },
      getAllStateStatusColors: function() {
        return stateWiseStatusColor;
      },
      getActiveStateComponentStatusColor: function(componentName) {
        return _getActiveStateComponentStatus(componentName);
      },
      getActiveStateComponentNeedsUpdateStatus: function(componentName) {
        return _getActiveStateComponentNeedsUpdateStatus(componentName);
      },
      getActiveStateContentIdStatusColor: function(contentId) {
        return _getActiveStateContentIdStatusColor(contentId);
      },
      getActiveStateContentIdNeedsUpdateStatus: function(contentId) {
        return _getActiveStateContentIdNeedsUpdateStatus(contentId);
      }
    };
  }]);
