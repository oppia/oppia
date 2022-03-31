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

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').factory('TranslationStatusService', [
  'ExplorationStatesService', 'StateRecordedVoiceoversService',
  'StateWrittenTranslationsService', 'TranslationLanguageService',
  'TranslationTabActiveModeService', 'COMPONENT_NAME_HINT',
  'COMPONENT_NAME_RULE_INPUT', 'INTERACTION_SPECS',
  function(
      ExplorationStatesService, StateRecordedVoiceoversService,
      StateWrittenTranslationsService, TranslationLanguageService,
      TranslationTabActiveModeService, COMPONENT_NAME_HINT,
      COMPONENT_NAME_RULE_INPUT, INTERACTION_SPECS) {
    var AUDIO_NEEDS_UPDATE_MESSAGE = ['Audio needs update!'];
    var TRANSLATION_NEEDS_UPDATE_MESSAGE = ['Translation needs update!'];
    var ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
    var FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
    var NO_ASSETS_AVAILABLE_COLOR = '#D14836';

    var langCode = TranslationLanguageService.getActiveLanguageCode();
    var stateNeedsUpdateWarnings = {};
    var stateWiseStatusColor = {};
    var explorationTranslationContentRequiredCount = 0;
    var explorationVoiceoverContentRequiredCount = 0;
    var explorationTranslationContentNotAvailableCount = 0;
    var explorationVoiceoverContentNotAvailableCount = 0;

    var _getVoiceOverStatus = function(recordedVoiceovers, contentId) {
      var availabilityStatus = {
        available: false,
        needsUpdate: false,
      };
      var availableLanguages = recordedVoiceovers.getLanguageCodes(
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
        writtenTranslations.getLanguageCodes(contentId));
      if (availableLanguages.indexOf(langCode) !== -1) {
        var writtenTranslation = (
          writtenTranslations.getWrittenTranslation(contentId, langCode));
        if (writtenTranslation.translation !== '') {
          availabilityStatus.available = true;
          availabilityStatus.needsUpdate = writtenTranslation.needsUpdate;
        }
      }
      return availabilityStatus;
    };
    var _getContentAvailabilityStatus = function(stateName, contentId) {
      langCode = TranslationLanguageService.getActiveLanguageCode();
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        // var writtenTranslations = (
          // ExplorationStatesService.getWrittenTranslationsMemento(stateName));
        return {'available': true, 'needsUpdate':true};
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
      explorationTranslationContentRequiredCount = 0;
      explorationVoiceoverContentRequiredCount = 0;
      explorationTranslationContentNotAvailableCount = 0;
      explorationVoiceoverContentNotAvailableCount = 0;

      if (ExplorationStatesService.isInitialized()) {
        ExplorationStatesService.getStateNames().forEach(function(stateName) {
          var stateNeedsUpdate = false;
          var noTranslationCount = 0;
          var noVoiceoverCount = 0;
          var recordedVoiceovers = (
            ExplorationStatesService.getRecordedVoiceoversMemento(stateName));
          var allContentIds = recordedVoiceovers.getAllContentIds();
          var interactionId = ExplorationStatesService.getInteractionIdMemento(
            stateName);
          // This is used to prevent users from adding unwanted hints audio, as
          // of now we do not delete interaction.hints when a user deletes
          // interaction, so these hints audio are not counted in checking
          // status of a state.
          if (!interactionId ||
            INTERACTION_SPECS[interactionId].is_linear ||
            INTERACTION_SPECS[interactionId].is_terminal) {
            var contentIdToRemove = _getContentIdListRelatedToComponent(
              COMPONENT_NAME_HINT, allContentIds);
            // Excluding default_outcome content status as default outcome's
            // content is left empty so the translation or voiceover is not
            // required.
            contentIdToRemove.push('default_outcome');
            allContentIds = allContentIds.filter(function(contentId) {
              return contentIdToRemove.indexOf(contentId) < 0;
            });
          }

          explorationTranslationContentRequiredCount += allContentIds.length;

          // Rule inputs do not need voiceovers. To have an accurate
          // representation of the progress bar for voiceovers, we remove rule
          // input content ids.
          const ruleInputContentIds = _getContentIdListRelatedToComponent(
            COMPONENT_NAME_RULE_INPUT, allContentIds);
          explorationVoiceoverContentRequiredCount += (
            allContentIds.length - ruleInputContentIds.length);
          if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
            allContentIds = allContentIds.filter(function(contentId) {
              return ruleInputContentIds.indexOf(contentId) < 0;
            });
          }

          allContentIds.forEach(function(contentId) {
            var availabilityStatus = _getContentAvailabilityStatus(
              stateName, contentId);
            if (!availabilityStatus.available) {
              noTranslationCount++;
              if (contentId.indexOf(COMPONENT_NAME_RULE_INPUT) !== 0) {
                noVoiceoverCount++;
              }
            }
            if (availabilityStatus.needsUpdate) {
              if (TranslationTabActiveModeService.isTranslationModeActive()) {
                stateNeedsUpdateWarnings[stateName] = (
                  TRANSLATION_NEEDS_UPDATE_MESSAGE);
                stateNeedsUpdate = true;
              } else {
                stateNeedsUpdateWarnings[stateName] = (
                  AUDIO_NEEDS_UPDATE_MESSAGE);
                stateNeedsUpdate = true;
              }
            }
          });
          explorationTranslationContentNotAvailableCount += noTranslationCount;
          explorationVoiceoverContentNotAvailableCount += noVoiceoverCount;
          if (noTranslationCount === 0 && !stateNeedsUpdate) {
            stateWiseStatusColor[stateName] = ALL_ASSETS_AVAILABLE_COLOR;
          } else if (
            noTranslationCount === allContentIds.length && !stateNeedsUpdate) {
            stateWiseStatusColor[stateName] = NO_ASSETS_AVAILABLE_COLOR;
          } else {
            stateWiseStatusColor[stateName] = FEW_ASSETS_AVAILABLE_COLOR;
          }
        });
      }
    };

    var _getContentIdListRelatedToComponent = function(
        componentName, availableContentIds) {
      var contentIdList = [];

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
      var contentIdList = _getContentIdListRelatedToComponent(
        componentName, _getAvailableContentIds());
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

    var _getAvailableContentIds = function() {
      var availableContentIds = [];
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        var writtenTranslations = StateWrittenTranslationsService.displayed;
        availableContentIds = writtenTranslations.getAllContentIds();
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        var recordedVoiceovers = StateRecordedVoiceoversService.displayed;
        availableContentIds = recordedVoiceovers.getAllContentIds();
      }

      return availableContentIds;
    };

    var _getActiveStateComponentNeedsUpdateStatus = function(componentName) {
      var contentIdList = _getContentIdListRelatedToComponent(
        componentName, _getAvailableContentIds());
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

    const _getExplorationContentRequiredCount = () => {
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        return explorationTranslationContentRequiredCount;
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        return explorationVoiceoverContentRequiredCount;
      }
    };

    const _getExplorationContentNotAvailableCount = () => {
      if (TranslationTabActiveModeService.isTranslationModeActive()) {
        return explorationTranslationContentNotAvailableCount;
      } else if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
        return explorationVoiceoverContentNotAvailableCount;
      }
    };

    return {
      refresh: function() {
        _computeAllStatesStatus();
      },
      getAllStatesNeedUpdatewarning: function() {
        return stateNeedsUpdateWarnings;
      },
      getExplorationContentRequiredCount: function() {
        return _getExplorationContentRequiredCount();
      },
      getExplorationContentNotAvailableCount: function() {
        return _getExplorationContentNotAvailableCount();
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
