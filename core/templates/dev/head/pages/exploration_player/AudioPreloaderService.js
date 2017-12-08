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
  '$modal', 'ExplorationContextService', 'AssetsBackendApiService',
  'ExplorationPlayerStateService', 'UrlInterpolationService',
  'AudioTranslationManagerService', 'LanguageUtilService',
  'ComputeGraphService',
  function($modal, ExplorationContextService, AssetsBackendApiService,
      ExplorationPlayerStateService, UrlInterpolationService,
      AudioTranslationManagerService, LanguageUtilService,
      ComputeGraphService) {
    var MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 3;

    var _filesBeingDownloaded = [];
    var _filesToBeDownloaded = [];
    var _exploration = null;
    var _isRunning = false;
    var _audioLoadedCallback = null;
    var _mostRecentlyRequestedAudioOnCurrentCard = null;

    var _init = function(exploration) {
      _exploration = exploration;
    };

    var _getAudioFilesInBfsOrder = function(sourceStateName) {
      var languageCode = AudioTranslationManagerService
        .getCurrentAudioLanguageCode();
      var explorationGraph = ComputeGraphService.compute(
        _exploration.getInitialState().name, _exploration.getStates());
      var queue = [];
      var seen = {};
      var audioFiles = [];
      allAudioTranslations = _exploration.getAllAudioTranslations(
        languageCode);
      queue.push(sourceStateName);
      while (queue.length > 0) {
        var currStateName = queue.shift();
        var audioFile = allAudioTranslations[currStateName];
        if (audioFile != null) {
          audioFiles.push(audioFile.filename);
        }
        for (var e = 0; e < explorationGraph.links.length; e++) {
          var edge = explorationGraph.links[e];
          var dest = edge.target;
          if (edge.source === currStateName && !seen.hasOwnProperty(dest)) {
            seen[dest] = true;
            queue.push(dest);
          }
        }
      }
      return audioFiles;
    };

    var loadAudio = function(audioFile) {
      AssetsBackendApiService.loadAudio(
        ExplorationContextService.getExplorationId(), audioFile
        ).then(function(loadedAudio) {
          for (var i = 0; i < _filesBeingDownloaded.length; i++) {
            if (_filesBeingDownloaded[i] === audioFile) {
              _filesBeingDownloaded.splice(i, 1);
              break;
            }
          }
          if (_filesToBeDownloaded.length > 0) {
            var audioFile = _filesToBeDownloaded.shift();
            _filesBeingDownloaded.push(audioFile);
            loadAudio(audioFile);
          }
          if (_audioLoadedCallback) {
            _audioLoadedCallback(loadedAudio.filename);
          }
        });
    };

    var _kickOffAudioPreloader = function(sourceStateName) {
      _isRunning = true;
      _filesToBeDownloaded = _getAudioFilesInBfsOrder(sourceStateName);
      while (_filesBeingDownloaded.length <
          MAX_NUM_AUDIO_FILES_TO_DOWNLOAD_SIMULTANEOUSLY && 
          _filesToBeDownloaded.length > 0) {
        var audioFile = _filesToBeDownloaded.shift();
        _filesBeingDownloaded.push(audioFile);
        loadAudio(audioFile);
      }
    };

    var _cancelPreloading = function() {
      _isRunning = false;
      AssetsBackendApiService.abortAllCurrentDownloads();
      _filesBeingDownloaded.forEach(function(file) {
        _filesToBeDownloaded.push(file);
      });
      _filesBeingDownloaded = [];
    };

    return {
      init: function(exploration) {
        _init(exploration);
      },
      kickOffAudioPreloader: function(sourceStateName) {
        _kickOffAudioPreloader(sourceStateName);
      },
      isLoadingAudioFile: function(filename) {
        return _filesBeingDownloaded.indexOf(filename) !== -1;
      },
      restartAudioPreloader: function(sourceStateName) {
        _cancelPreloading();
        _kickOffAudioPreloader(sourceStateName);
      },
      isRunning: function() {
        return _isRunning;
      },
      setAudioLoadedCallback: function(audioLoadedCallback) {
        _audioLoadedCallback = audioLoadedCallback;
      },
      setMostRecentlyRequestedAudioOnCurrentCard: function(
          mostRecentlyRequestedAudio) {
        _mostRecentlyRequestedAudioOnCurrentCard = mostRecentlyRequestedAudio;
      },
      clearMostRecentlyRequestedAudioOnCurrentCard: function() {
        _mostRecentlyRequestedAudioOnCurrentCard = null;
      },
      getMostRecentlyRequestedAudioOnCurrentCard: function() {
        return _mostRecentlyRequestedAudioOnCurrentCard;
      }
    };
  }
]);
