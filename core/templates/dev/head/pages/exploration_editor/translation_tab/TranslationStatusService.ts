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

oppia.factory('TranslationStatusService', [
  'ExplorationStatesService', 'StateContentIdsToAudioTranslationsService',
  'StateWrittenTranslationsService', 'TranslationLanguageService',
  'TranslationTabActiveModeService', 'INTERACTION_SPECS', function(
      ExplorationStatesService, StateContentIdsToAudioTranslationsService,
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
    var contentIdsToAudioTranslations =
        StateContentIdsToAudioTranslationsService.displayed;

    var _getVoiceOverStatus = function(
        contentIdsToAudioTranslations, contentId) {
      // The first value of availabilityStatus shows whether an audio is
      // available for a contentId in a given language, whereas the last value
      // represent whether the available audio needs update.
      var availabilityStatus = {
        available: false,
        needsUpdate: false,
      };
      var availableLanguages = (
        contentIdsToAudioTranslations.getAudioLanguageCodes(contentId));
      if (availableLanguages.indexOf(langCode) !== -1) {
        availabilityStatus.available = true;
        var audioTranslation = (
          contentIdsToAudioTranslations.getAudioTranslation(
            contentId, langCode));
        availabilityStatus.needsUpdate = audioTranslation.needsUpdate;
      }
      return availabilityStatus;
    };

    var _getTranslationStatus = function(writtenTranslations, contentId) {
      // The first value of availabilityStatus shows whether a translation is
      // available for a contentId in a given language, whereas the last value
      // represent whether the available translation needs update.
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
        var contentIdsToAudioTranslations = (
          ExplorationStatesService.getContentIdsToAudioTranslationsMemento(
            stateName));
        return _getVoiceOverStatus(contentIdsToAudioTranslations, contentId);
      }
    };

    var _getActiveStateContentAvailabilityStatus = function(contentId) {
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        var writtenTranslations = StateWrittenTranslationsService.displayed;
        return _getTranslationStatus(writtenTranslations, contentId);
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        var contentIdsToAudioTranslations = (
          StateContentIdsToAudioTranslationsService.displayed);
        return _getVoiceOverStatus(contentIdsToAudioTranslations, contentId);
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
          var contentIdsToAudioTranslations = ExplorationStatesService
            .getContentIdsToAudioTranslationsMemento(stateName);
          var allContentId = contentIdsToAudioTranslations.getAllContentId();
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
        var contentIdsToAudioTranslations = (
          StateContentIdsToAudioTranslationsService.displayed);
        availableContentIds = contentIdsToAudioTranslations.getAllContentId();
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
        _computeAllStatesStatus();
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
