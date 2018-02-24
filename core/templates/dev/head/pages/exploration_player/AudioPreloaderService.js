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
  '$uibModal', 'ExplorationContextService', 'AssetsBackendApiService',
  'ExplorationPlayerStateService', 'UrlInterpolationService',
  'AudioTranslationLanguageService', 'LanguageUtilService',
  'ComputeGraphService',
  function($uibModal, ExplorationContextService, AssetsBackendApiService,
      ExplorationPlayerStateService, UrlInterpolationService,
      AudioTranslationLanguageService, LanguageUtilService,
      ComputeGraphService) {
    var MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;

    var _filenamesOfAudioCurrentlyDownloading = [];
    var _filenamesOfAudioToBeDownloaded = [];
    var _exploration = null;
    var _audioLoadedCallback = null;
    var _mostRecentlyRequestedAudioFilename = null;

    var _init = function(exploration) {
      _exploration = exploration;
    };

    var _getAudioFilenamesInBfsOrder = function(sourceStateName) {
      var languageCode = AudioTranslationLanguageService
        .getCurrentAudioLanguageCode();
      var stateNamesInBfsOrder =
        ComputeGraphService.computeBfsTraversalOfStates(
          _exploration.getInitialState().name,
          _exploration.getStates(),
          sourceStateName);
      var audioFilenames = [];
      allAudioTranslations = _exploration.getAllAudioTranslations(
        languageCode);
      stateNamesInBfsOrder.forEach(function(stateName) {
        var allAudioTranslationsForState = allAudioTranslations[stateName];
        allAudioTranslationsForState.forEach(function(audioTranslation) {
          audioFilenames.push(audioTranslation.filename);
        });
      });
      return audioFilenames;
    };

    var _loadAudio = function(audioFilename) {
      AssetsBackendApiService.loadAudio(
        ExplorationContextService.getExplorationId(), audioFilename
      ).then(function(loadedAudio) {
        for (var i = 0;
             i < _filenamesOfAudioCurrentlyDownloading.length; i++) {
          if (_filenamesOfAudioCurrentlyDownloading[i] ===
              loadedAudio.filename) {
            _filenamesOfAudioCurrentlyDownloading.splice(i, 1);
            break;
          }
        }
        if (_filenamesOfAudioToBeDownloaded.length > 0) {
          var nextAudioFilename = _filenamesOfAudioToBeDownloaded.shift();
          _filenamesOfAudioCurrentlyDownloading.push(nextAudioFilename);
          _loadAudio(nextAudioFilename);
        }
        if (_audioLoadedCallback) {
          _audioLoadedCallback(loadedAudio.filename);
        }
      });
    };

    var _kickOffAudioPreloader = function(sourceStateName) {
      _filenamesOfAudioToBeDownloaded =
        _getAudioFilenamesInBfsOrder(sourceStateName);
      while (_filenamesOfAudioCurrentlyDownloading.length <
          MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY &&
          _filenamesOfAudioToBeDownloaded.length > 0) {
        var audioFilename = _filenamesOfAudioToBeDownloaded.shift();
        _filenamesOfAudioCurrentlyDownloading.push(audioFilename);
        _loadAudio(audioFilename);
      }
    };

    var _cancelPreloading = function() {
      AssetsBackendApiService.abortAllCurrentDownloads();
      _filenamesOfAudioCurrentlyDownloading = [];
    };

    return {
      init: function(exploration) {
        _init(exploration);
      },
      kickOffAudioPreloader: function(sourceStateName) {
        _kickOffAudioPreloader(sourceStateName);
      },
      isLoadingAudioFile: function(filename) {
        return _filenamesOfAudioCurrentlyDownloading.indexOf(filename) !== -1;
      },
      restartAudioPreloader: function(sourceStateName) {
        _cancelPreloading();
        _kickOffAudioPreloader(sourceStateName);
      },
      setAudioLoadedCallback: function(audioLoadedCallback) {
        _audioLoadedCallback = audioLoadedCallback;
      },
      setMostRecentlyRequestedAudioFilename: function(
          mostRecentlyRequestedAudioFilename) {
        _mostRecentlyRequestedAudioFilename =
          mostRecentlyRequestedAudioFilename;
      },
      clearMostRecentlyRequestedAudioFilename: function() {
        _mostRecentlyRequestedAudioFilename = null;
      },
      getMostRecentlyRequestedAudioFilename: function() {
        return _mostRecentlyRequestedAudioFilename;
      },
      getFilenamesOfAudioCurrentlyDownloading: function() {
        return _filenamesOfAudioCurrentlyDownloading;
      }
    };
  }
]);
