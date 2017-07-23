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
 * used for audio translations as well as related modals.
 */

oppia.factory('AudioTranslationManagerService', [
  '$modal', 'ExplorationPlayerStateService', 'AudioPlayerService',
  function(
      $modal, ExplorationPlayerStateService, AudioPlayerService) {
    var _currentAudioLanguageCode = null;
    var _allLanguageCodesInExploration = null;

    var _init = function() {
      _allLanguageCodesInExploration =
        ExplorationPlayerStateService.getAllAudioLanguageCodes();

      // TODO(tjiang11): Define an order. Preferably, we'd want
      // to promote the user's preferred languages, and promote
      // the exploration's default language if available.
      _allLanguageCodesInExploration.sort();

      if (_allLanguageCodesInExploration.length == 1) {
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
          'AudioTranslationManagerService',
          function(
              $scope, $filter, $modalInstance,
              AudioTranslationManagerService) {
            $scope.selectedLanguage =
              $filter('languageDescription')(_currentAudioLanguageCode);
            $scope.allLanguageCodes =
              AudioTranslationManagerService
                .getAllLanguageCodesInExploration();

            $scope.save = function() {
              var selectedLanguageCode = 
                $filter('languageCode')($scope.selectedLanguage);
              $modalInstance.close({
                languageCode: selectedLanguageCode
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
      init: function() {
        _init();
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

oppia.filter('languageDescriptions', ['$filter', function($filter) {
  return function(languageCodes) {
    var languageDescriptions = [];
    angular.forEach(languageCodes, function(languageCode) {
      languageDescriptions.push(
        $filter('languageDescription')(languageCode));
    });
    return languageDescriptions;
  };
}]);


oppia.filter('languageDescription', function() {
  var _getLanguageDescription = function(languageCode) {
    for (var i = 0; i < constants.SUPPORTED_AUDIO_LANGUAGES.length; i++) {
      if (constants.SUPPORTED_AUDIO_LANGUAGES[i].id === languageCode) {
        return constants.SUPPORTED_AUDIO_LANGUAGES[i].text;
      }
    }
  };
  return function(languageCode) {
    return _getLanguageDescription(languageCode);
  };
});

oppia.filter('languageCode', function () {
  var _getLanguageCode = function(languageDescription) {
    for (var i = 0; i < constants.SUPPORTED_AUDIO_LANGUAGES.length; i++) {
      if (constants.SUPPORTED_AUDIO_LANGUAGES[i].text ===
          languageDescription) {
        return constants.SUPPORTED_AUDIO_LANGUAGES[i].id;
      }
    }
  };
  return function(languageDescription) {
    return _getLanguageCode(languageDescription);
  };
});
