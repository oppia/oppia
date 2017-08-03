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
 * @fileoverview Service to manage the current language being
 * used for audio translations.
 */

oppia.factory('AudioTranslationManagerService', [
  '$modal', 'AudioPlayerService',
  function(
      $modal, AudioPlayerService) {
    var _currentAudioLanguageCode = null;
    var _allLanguageCodesInExploration = null;

    var _init = function(allLanguageCodesInExploration) {
      _allLanguageCodesInExploration = allLanguageCodesInExploration;

      // TODO(tjiang11): Define an order. Preferably, we'd want
      // to promote the user's preferred languages, and promote
      // the exploration's default language if available.
      _allLanguageCodesInExploration.sort();

      if (_allLanguageCodesInExploration.length === 1) {
        _currentAudioLanguageCode = _allLanguageCodesInExploration[0];
      }

      if (_allLanguageCodesInExploration.length > 1) {
        // TODO(tjiang11): Need to use a pick-language modal instead of
        // defaulting to a language.
        _currentAudioLanguageCode = _allLanguageCodesInExploration[0];
      }
    };

    var _showAudioTranslationSettingsModal = function() {
      $modal.open({
        templateUrl: 'modals/audioTranslationSettings',
        resolve: {},
        controller: [
          '$scope', '$filter', '$modalInstance',
          'AudioTranslationManagerService', 'LanguageUtilService',
          function(
              $scope, $filter, $modalInstance,
              AudioTranslationManagerService, LanguageUtilService) {
            var allLanguageCodes =
              AudioTranslationManagerService
                .getAllLanguageCodesInExploration();

            $scope.languagesInExploration = [];

            allLanguageCodes.map(function(languageCode) {
              var languageDescription =
                LanguageUtilService.getAudioLanguageDescription(languageCode);
              $scope.languagesInExploration.push({
                value: languageCode,
                displayed: languageDescription
              });
            });

            $scope.selectedLanguage = _currentAudioLanguageCode;
            $scope.save = function() {
              $modalInstance.close({
                languageCode: $scope.selectedLanguage
              });
            };
          }
        ]
      }).result.then(function(result) {
        if (_currentAudioLanguageCode !== result.languageCode) {
          _currentAudioLanguageCode = result.languageCode;
          AudioPlayerService.stop();
          AudioPlayerService.clear();
        }
      });
    };

    return {
      init: function(allLanguageCodesInExploration) {
        _init(allLanguageCodesInExploration);
      },
      getCurrentAudioLanguageCode: function() {
        return _currentAudioLanguageCode;
      },
      getAllLanguageCodesInExploration: function() {
        return _allLanguageCodesInExploration;
      },
      showAudioTranslationSettingsModal: function() {
        return _showAudioTranslationSettingsModal();
      }
    };
  }]);
