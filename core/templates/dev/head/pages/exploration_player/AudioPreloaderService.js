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

oppia.factory('AudioPreloaderService', 
  ['explorationContextService', 'AssetsBackendApiService',
  'ExplorationPlayerStateService',
  function(explorationContextService, AssetsBackendApiService,
    ExplorationPlayerStateService) {
    var _hasPreloaded = false;
    var _excludedFilename = null;

    var _preload = function() {
      var allAudioTranslations =
        ExplorationPlayerStateService
          .getExploration().getAllAudioTranslations();
      for (var languageCode in allAudioTranslations) {
        var audioTranslation = allAudioTranslations[languageCode];
        if (audioTranslation.filename !== _excludedFilename) {
          AssetsBackendApiService.loadAudio(
            explorationContextService.getExplorationId(),
            audioTranslation.filename);
        }
      }
      _hasPreloaded = true;
    };

    return {
      init: function() {
        _init();
      },
      hasPreloaded: function() {
        return _hasPreloaded;
      },
      preload: function() {
        _preload();
      },
      excludeFile: function(filename) {
        _excludedFilename = filename;
      }
    };
  }
]);