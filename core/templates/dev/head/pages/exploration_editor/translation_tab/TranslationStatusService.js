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
 * it's components.
 */

oppia.factory('TranslationStatusService', [
  'stateContentIdsToAudioTranslationsService', 'ExplorationStatesService',
  'TranslationLanguageService', function(
      stateContentIdsToAudioTranslationsService, ExplorationStatesService,
      TranslationLanguageService) {
    var NEEDS_UPDATE_MESSAGE = ['Audio needs updates!'];
    var ALL_AUDIO_AVAILABLE_COLOR = '#16A765';
    var FEW_AUDIO_AVAILABLE_COLOR = '#E9B330';
    var NO_AUDIO_AVAILABLE_COLOR = '#D14836';

    var langCode = TranslationLanguageService.getActiveLanguageCode();
    var stateNeedsUpdateWarnings = {};
    var stateWiseStatusColor = {};
    var explorationAudioRequiredCount = 0;
    var explorationAudioNotAvailableCount = 0;
    var contentIdsToAudioTranslations =
        stateContentIdsToAudioTranslationsService.displayed;
    var _computeAllStatesStatus = function() {
      langCode = TranslationLanguageService.getActiveLanguageCode();
      stateNeedsUpdateWarnings = {};
      stateWiseStatusColor = {};
      explorationAudioRequiredCount = 0;
      explorationAudioNotAvailableCount = 0;
      if (ExplorationStatesService.isInitialized()) {
        ExplorationStatesService.getStateNames().forEach(function(stateName) {
          var noTranslationCount = 0;
          var contentIdsToAudioTranslations = ExplorationStatesService
            .getContentIdsToAudioTranslationsMemento(stateName);
          var allContentId = contentIdsToAudioTranslations.getAllContentId();
          explorationAudioRequiredCount += allContentId.length;
          allContentId.forEach(function(contentId) {
            availableTranslationLanguageCode = contentIdsToAudioTranslations
              .getAudioLanguageCodes(contentId);
            if (availableTranslationLanguageCode.indexOf(langCode) > -1) {
              var audioTranslation = contentIdsToAudioTranslations
                .getAudioTranslation(contentId, langCode);
              if (audioTranslation.needsUpdate) {
                stateNeedsUpdateWarnings[stateName] = NEEDS_UPDATE_MESSAGE;
              }
            } else {
              noTranslationCount++;
            }
          });
          explorationAudioNotAvailableCount += noTranslationCount;
          if (noTranslationCount === 0) {
            stateWiseStatusColor[stateName] = ALL_AUDIO_AVAILABLE_COLOR;
          } else if (noTranslationCount === allContentId.length) {
            stateWiseStatusColor[stateName] = NO_AUDIO_AVAILABLE_COLOR;
          } else {
            stateWiseStatusColor[stateName] = FEW_AUDIO_AVAILABLE_COLOR;
          }
        });
      }
    };

    var _getContentIdListRelatedToComponent = function (componentName) {
      contentIdsToAudioTranslations =
        stateContentIdsToAudioTranslationsService.displayed;
      if (contentIdsToAudioTranslations) {
        var contentIdList = [];
        if (componentName === 'solution' || componentName === 'content') {
          contentIdList.push(componentName);
        } else {
          var searchKey = componentName + '_';
          contentIdsToAudioTranslations.getAllContentId().forEach(
            function(contentId) {
              if (contentId.indexOf(searchKey) > -1) {
                contentIdList.push(contentId);
              }
            }
          );
          if (componentName === 'feedback') {
            contentIdList.push('default_outcome');
          }
        }
        return contentIdList;
      } else {
        return null;
      }
    };

    var _getActiveStateComponentStatus = function(componentName) {
      var contentIdList = _getContentIdListRelatedToComponent(componentName);
      var availableAudioCount = 0;
      if (contentIdList) {
        contentIdList.forEach(function(contentId) {
          if (contentIdsToAudioTranslations
            .getAudioLanguageCodes(contentId).indexOf(langCode) > -1) {
            availableAudioCount++;
          }
        });
        if (contentIdList.length === availableAudioCount) {
          return ALL_AUDIO_AVAILABLE_COLOR;
        } else if (availableAudioCount === 0) {
          return NO_AUDIO_AVAILABLE_COLOR;
        } else {
          return FEW_AUDIO_AVAILABLE_COLOR;
        }
      }
    };

    var _getActiveStateComponentNeedsUpdateStatus = function(componentName) {
      var contentIdList = _getContentIdListRelatedToComponent(componentName);
      if (contentIdList) {
        contentIdList.forEach(function(contentId) {
          if (contentIdsToAudioTranslations
            .getAudioLanguageCodes(contentId).indexOf(langCode) > -1) {
            var audioTranslation = contentIdsToAudioTranslations
              .getAudioTranslation(contentId, langCode);
            if (audioTranslation.needsUpdate) {
              return true;
            }
          }
        });
      }
      return false;
    };

    var _getActiveStateContentIdStatusColor = function(contentId) {
      contentIdsToAudioTranslations =
        stateContentIdsToAudioTranslationsService.displayed;
      if (contentIdsToAudioTranslations) {
        if (contentIdsToAudioTranslations
          .getAudioLanguageCodes(contentId).indexOf(langCode) > -1) {
          return ALL_AUDIO_AVAILABLE_COLOR;
        } else {
          return NO_AUDIO_AVAILABLE_COLOR;
        }
      }
    };

    var _getActiveStateContentIdNeedsUpdateStatus = function(contentId) {
      contentIdsToAudioTranslations =
        stateContentIdsToAudioTranslationsService.displayed;
      if (contentIdsToAudioTranslations) {
        if (contentIdsToAudioTranslations
          .getAudioLanguageCodes(contentId).indexOf(langCode) > -1) {
          var audioTranslation = contentIdsToAudioTranslations
            .getAudioTranslation(contentId, langCode);
          if (audioTranslation.needsUpdate) {
            return true;
          } else {
            return false;
          }
        }
      }
    };

    return {
      getAllStatesNeedUpdatewarning: function() {
        return stateNeedsUpdateWarnings;
      },
      getExplorationAudioRequiredCount: function() {
        return explorationAudioRequiredCount;
      },
      getExplorationAudioNotAvailableCount: function() {
        return explorationAudioNotAvailableCount;
      },
      getAllStateStatusColour: function() {
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
      getActiveStateContentIdNeedsUpdateStatus: function (contentId) {
        return _getActiveStateContentIdNeedsUpdateStatus(contentId);
      }
    };
  }]);
