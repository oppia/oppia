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
 * @fileoverview Directive for a set of audio controls for a specific
 * audio translation in the learner view.
 */

oppia.directive('audioControls', [
  'UrlInterpolationService', 'AudioPreloaderService',
  function(UrlInterpolationService, AudioPreloaderService) {
    return {
      restrict: 'E',
      scope: {
        getAudioTranslations: '&audioTranslations'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'audio_controls_directive.html'),
      controller: [
        '$scope', 'AudioTranslationManagerService', 'AudioPlayerService',
        'LanguageUtilService', 'AssetsBackendApiService',
        function(
            $scope, AudioTranslationManagerService, AudioPlayerService,
            LanguageUtilService, AssetsBackendApiService) {
          // This ID is passed in to AudioPlayerService as a means of
          // distinguishing which audio directive is currently playing audio.
          var directiveId = Math.random().toString(36).substr(2, 10);


          var getCurrentAudioLanguageCode = function() {
            return AudioTranslationManagerService.getCurrentAudioLanguageCode();
          };

          $scope.getCurrentAudioLanguageDescription = function() {
            return AudioTranslationManagerService
              .getCurrentAudioLanguageDescription();
          };

          var getAudioTranslationInCurrentLanguage = function() {
            return $scope.getAudioTranslations()[
              AudioTranslationManagerService.getCurrentAudioLanguageCode()];
          };

          $scope.isAudioLoading = false;

          $scope.AudioPlayerService = AudioPlayerService;

          $scope.IMAGE_URL_REWIND_AUDIO_BUTTON = (
            UrlInterpolationService.getStaticImageUrl(
              '/icons/rewind-five.svg'));

          $scope.isAudioAvailableInCurrentLanguage = function() {
            return Boolean(getAudioTranslationInCurrentLanguage());
          };

          $scope.doesCurrentAudioTranslationNeedUpdate = function() {
            return getAudioTranslationInCurrentLanguage().needsUpdate;
          };

          $scope.onSpeakerIconClicked = function() {
            if (!$scope.isAudioLoading) {
              var audioTranslation = getAudioTranslationInCurrentLanguage();
              if (audioTranslation) {
                // If this language hasn't been preloaded for the exploration,
                // and this audio translation hasn't been loaded, then ask to
                // preload all audio translations for the current language.
                if (!AudioPreloaderService.hasPreloadedLanguage(
                      getCurrentAudioLanguageCode()) &&
                      !isCached(audioTranslation)) {
                  AudioPreloaderService.showBandwidthConfirmationModal(
                    $scope.getAudioTranslations(),
                    getCurrentAudioLanguageCode(),
                    playPauseAudioTranslation);
                } else {
                  playPauseAudioTranslation(getCurrentAudioLanguageCode());
                }
              } else {
                // If the audio translation isn't available in the current
                // language, then open the settings modal.
                $scope.openAudioTranslationSettings();
              }
            }
          };

          var isCached = function(audioTranslation) {
            return AssetsBackendApiService.isCached(audioTranslation.filename);
          };

          var playPauseAudioTranslation = function(languageCode) {
            $scope.extraAudioControlsAreShown = true;

            if (!AudioPlayerService.isPlaying()) {
              if (AudioPlayerService.isTrackLoaded() &&
                  isRequestForSameAudioAsLastTime()) {
                AudioPlayerService.play();
              } else {
                loadAndPlayAudioTranslation();
              }
            } else {
              AudioPlayerService.pause();
              if (!isRequestForSameAudioAsLastTime()) {
                // After pausing the currently playing audio,
                // immediately start playing the newly requested audio.
                loadAndPlayAudioTranslation();
              }
            }
          };

          var isRequestForSameAudioAsLastTime = function() {
            return directiveId ===
              AudioPlayerService.getCurrentAudioControlsDirectiveId();
          };

          var loadAndPlayAudioTranslation = function() {
            $scope.isAudioLoading = true;
            var audioTranslation = getAudioTranslationInCurrentLanguage();
            if (audioTranslation) {
              AudioPlayerService.load(
                audioTranslation.filename, directiveId).then(function() {
                  $scope.isAudioLoading = false;
                  AudioPlayerService.play();
                });
            }
          };

          $scope.rewindAudioFiveSec = function() {
            AudioPlayerService.rewind(5);
          };

          $scope.openAudioTranslationSettings = function() {
            AudioTranslationManagerService.showAudioTranslationSettingsModal();
          };
        }]
    }
  }
]);
