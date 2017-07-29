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
  'UrlInterpolationService', function(UrlInterpolationService) {
  return {
    restrict: 'E',
    scope: {
      audioTranslations: '='
    },
    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/exploration_player/' +
      'audio_controls_directive.html'),
    controller: [
      '$scope', 'AudioTranslationManagerService', 'AudioPlayerService',
      function(
          $scope, AudioTranslationManagerService, AudioPlayerService) {

      var filenameOfLastStartedAudio;

      $scope.AUDIO_SETTINGS_BUTTON_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/icons/settings.svg'));

      var PLAY_AUDIO_BUTTON_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/icons/speaker-not-playing.svg'));

      var PAUSE_AUDIO_BUTTON_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/icons/speaker-playing.svg'));

      $scope.REWIND_AUDIO_BUTTON_IMAGE_URL = (
        UrlInterpolationService.getStaticImageUrl(
          '/icons/rewind-five.svg'));

      $scope.playPauseAudioTranslation = function() {
        // TODO(tjiang11): Change from on-demand loading to pre-loading.

        // TODO(tjiang11): On first play, ask learner to pick language
        // and subsequently for confirmation to use bandwidth 
        // to download audio files.

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
            loadAndPlayAudioTranslation();
          }
        }
      };

      var isRequestForSameAudioAsLastTime = function() {
        var requestedAudioTranslation =
          $scope.audioTranslations[
            AudioTranslationManagerService.getCurrentAudioLanguageCode()];
        return filenameOfLastStartedAudio ==
          requestedAudioTranslation.filename;
      };

      var loadAndPlayAudioTranslation = function() {

        var currentAudioLanguageCode =
          AudioTranslationManagerService.getCurrentAudioLanguageCode();

        // TODO(tjiang11): If audio translation is not available
        // in the current language, then inform the learner with
        // a piece of text below the audio controls.
        var audioTranslation =
          $scope.audioTranslations[currentAudioLanguageCode];

        if (audioTranslation) {
          filenameOfLastStartedAudio = audioTranslation.filename;
          AudioPlayerService.load(
            audioTranslation.filename).then(function() {
              AudioPlayerService.play();
            });
        }
      };

      $scope.rewindAudioFiveSec = function() {
        AudioPlayerService.rewind(5);
      };

      $scope.getPlayPauseButtonImageUrl = function() {
        return AudioPlayerService.isPlaying() && 
          isRequestForSameAudioAsLastTime() ?
          PAUSE_AUDIO_BUTTON_IMAGE_URL : PLAY_AUDIO_BUTTON_IMAGE_URL;
      };

      $scope.openAudioTranslationSettings = function() {
        AudioTranslationManagerService
          .showAudioTranslationSettingsModal();
      };

    }]
  }
}]);