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
 * @fileoverview Service to operate the playback of audio.
 */

oppia.factory('AudioPlayerService', [
  '$q', '$timeout', 'ngAudio', 'AssetsBackendApiService',
  'explorationContextService',
  function(
      $q, $timeout, ngAudio, AssetsBackendApiService,
      explorationContextService) {
    var _currentTrackFilename = null;
    var _currentTrack = null;

    var _load = function(filename, successCallback, errorCallback) {
      if (filename !== _currentTrackFilename) {
        AssetsBackendApiService.loadAudio(
        explorationContextService.getExplorationId(), filename)
          .then(function(audioBlob) {
            var blobUrl = URL.createObjectURL(audioBlob);
            _currentTrack = ngAudio.load(blobUrl);
            _currentTrackFilename = filename; 

            // Doesn't seem to be any way of detecing when native
            // audio object has finished loading. Use a timeout
            // to grab native audio.
            // TODO(tjiang11): Find a better way to handle this.
            $timeout(function() {
              _currentTrack.audio.onended = function() {
                _currentTrack = null;
                _currentTrackFilename = null;
              }
            }, 100);

            successCallback();
          }, function(reason) {
            errorCallback(reason);
          });
      }
    };

    var _play = function() {
      if (_currentTrack) {
        _currentTrack.play();
      }
    };

    var _pause = function() {
      if (_currentTrack) {
        _currentTrack.pause();
      }
    };

    var _stop = function() {
      if (_currentTrack) {
        _currentTrack.stop();
      }
    };

    var _rewind = function(seconds) {
      if (_currentTrack) {
        var currentSeconds = _currentTrack.progress * _currentTrack.duration;
        var rewindedProgress =
          (currentSeconds - seconds) / _currentTrack.duration;
        _currentTrack.progress = rewindedProgress;
      }
    };

    return {
      load: function(filename) {
        return $q(function(resolve, reject) {
          _load(filename, resolve, reject);
        });
      },
      play: function() {
        _play();
      },
      pause: function() {
        _pause();
      },
      stop: function() {
        _stop();
      },
      rewind: function(seconds) {
        _rewind(seconds);
      },
      isPlaying: function() {
        if (!_currentTrack) {
          return false;
        }
        return !_currentTrack.paused;
      },
      trackLoaded: function() {
        return Boolean(_currentTrack);
      },
      clear: function() {
        _currentTrack = null;
        _currentTrackFilename = null;
      }
    };
  }
]);
