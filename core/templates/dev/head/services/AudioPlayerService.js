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
  'ExplorationContextService',
  function(
      $q, $timeout, ngAudio, AssetsBackendApiService,
      ExplorationContextService) {
    // The ID of the directive that contains the currently playing
    // audio. This is a unique generated string in each directive.
    var _currentAudioControlsDirectiveId = null;
    var _currentTrackFilename = null;
    var _currentTrack = null;

    var _load = function(
        filename, directiveId, successCallback, errorCallback) {
      if (filename !== _currentTrackFilename) {
        AssetsBackendApiService.loadAudio(
        ExplorationContextService.getExplorationId(), filename)
          .then(function(audioBlob) {
            var blobUrl = URL.createObjectURL(audioBlob);
            _currentTrack = ngAudio.load(blobUrl);
            _currentTrackFilename = filename;
            _currentAudioControlsDirectiveId = directiveId; 

            // ngAudio doesn't seem to be provide any way of detecting 
            // when native audio object has finished loading. It seems 
            // that after creating an ngAudio object, the native audio
            // object is asynchronously loaded. So we use a timeout 
            // to grab native audio.
            // TODO(tjiang11): Look for a better way to handle this.
            $timeout(function() {
              _currentTrack.audio.onended = function() {
                _currentTrack = null;
                _currentTrackFilename = null;
                _currentAudioControlsDirectiveId = null;
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
        _currentAudioControlsDirectiveId = null;
        _currentTrackFilename = null;
        _currentTrack = null;
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
      load: function(filename, directiveId) {
        return $q(function(resolve, reject) {
          _load(filename, directiveId, resolve, reject);
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
        return (_currentTrack && !_currentTrack.paused);
      },
      isTrackLoaded: function() {
        return Boolean(_currentTrack);
      },
      clear: function() {
        _currentTrack = null;
        _currentTrackFilename = null;
      },
      getCurrentAudioControlsDirectiveId: function() {
        return _currentAudioControlsDirectiveId;
      }
    };
  }
]);
