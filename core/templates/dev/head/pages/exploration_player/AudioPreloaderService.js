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
  'ExplorationPlayerStateService', 'UrlInterpolationService',
  function($modal, explorationContextService, AssetsBackendApiService,
      ExplorationPlayerStateService, UrlInterpolationService) {
    // Whether all audio files have been preloaded in the exploration.
    var _hasPreloaded = false;

    // This is a file to exclude while preloading all audio translations 
    // for an exploration. This is used to disregard the current audio file
    // which the user is loading to save some bandwidth, as it will be
    // loaded anyway.
    var _excludedFilename = null;

    var _preloadAllAudioFiles = function() {
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

    var _showBandwidthConfirmationModal = function(confirmationCallback) {
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_player/' +
          'audio_preload_bandwidth_confirmation_modal_directive.html'),
        resolve: {},
        backdrop: false,
        controller: [
          '$scope', '$modalInstance',
          'ExplorationPlayerStateService', 'AudioPreloaderService',
          function(
              $scope, $modalInstance,
              ExplorationPlayerStateService, AudioPreloaderService) {
            $scope.totalFileSizeOfAllAudioTranslationsMB =
              ExplorationPlayerStateService.getExploration()
                .getAllAudioTranslationsFileSizeMB().toPrecision(3);

            $scope.confirm = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
          }]
      }).result.then(function() {
        confirmationCallback();
        _preloadAllAudioFiles();
      });
    };

    return {
      init: function() {
        _init();
      },
      hasPreloaded: function() {
        return _hasPreloaded;
      },
      excludeFile: function(filename) {
        _excludedFilename = filename;
      },
      showBandwidthConfirmationModal: function(confirmationCallback) {
        _showBandwidthConfirmationModal(confirmationCallback);
      }
    };
  }
]);
