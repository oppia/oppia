// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to preload audio into AssetsBackendApiService's cache.
 */

oppia.factory('AudioPreloaderService', [
  '$modal', 'explorationContextService', 'AssetsBackendApiService',
  'UrlInterpolationService', 'AudioTranslationManagerService',
  'LanguageUtilService',
  function($modal, explorationContextService, AssetsBackendApiService,
      UrlInterpolationService, AudioTranslationManagerService,
      LanguageUtilService) {
    // List of languages that have been preloaded in the exploration.
    var _preloadedLanguageCodes = [];

    var _preloadAllAudioFiles = function(exploration, languageCode,
        currentlyRequestedAudioFilename,
        currentlyRequestedAudioLoadedCallback) {
      var allAudioTranslations =
        exploration.getAllAudioTranslations(languageCode);

      allAudioTranslations.map(function(audioTranslation) {
        AssetsBackendApiService.loadAudio(
          explorationContextService.getExplorationId(),
          audioTranslation.filename).then(function(loadedFilename) {
            if (audioTranslation.filename === currentlyRequestedAudioFilename) {
              currentlyRequestedAudioLoadedCallback();
            }
          });
      });

      _preloadedLanguageCodes.push(languageCode);
    };

    return {
      init: function() {
        _init();
      },
      hasPreloadedLanguage: function(languageCode) {
        return _preloadedLanguageCodes.indexOf(languageCode) !== -1;
      },
      preloadAllAudioFiles: function(exploration, languageCode,
        currentlyRequestedAudioFilename,
        currentlyRequestedAudioLoadedCallback) {
        _preloadAllAudioFiles(exploration, languageCode,
          currentlyRequestedAudioFilename,
          currentlyRequestedAudioLoadedCallback);
      }
    };
  }
]);
