// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the translation overview and changing
 * translation language.
 */

oppia.constant('DEFAULT_AUDIO_LANGUAGE', 'en');

oppia.directive('translatorOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isTranslationTabBusy: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'translator_overview_directive.html'),
      controller: [
        '$scope', '$rootScope', '$window', 'SUPPORTED_AUDIO_LANGUAGES',
        'LanguageUtilService', 'TranslationLanguageService',
        'TranslationStatusService', 'DEFAULT_AUDIO_LANGUAGE', function(
            $scope, $rootScope, $window, SUPPORTED_AUDIO_LANGUAGES,
            LanguageUtilService, TranslationLanguageService,
            TranslationStatusService, DEFAULT_AUDIO_LANGUAGE) {
          var LAST_SELECTED_TRANSLATION_LANGUAGE = (
            'last_selected_translation_lang');
          var prevLanguageCode = $window.localStorage.getItem(
            LAST_SELECTED_TRANSLATION_LANGUAGE);
          var allAudioLanguageCodes = LanguageUtilService
            .getAllAudioLanguageCodes();
          $scope.languageCode =
            allAudioLanguageCodes.indexOf(prevLanguageCode) !== -1 ?
              prevLanguageCode : DEFAULT_AUDIO_LANGUAGE;
          TranslationLanguageService.setActiveLanguageCode(
            $scope.languageCode);
          $scope.languageCodesAndDescriptions = (
            allAudioLanguageCodes.map(function(languageCode) {
              return {
                id: languageCode,
                description: (
                  LanguageUtilService.getAudioLanguageDescription(
                    languageCode))
              };
            }));
          $scope.getTranslationProgressStyle = function () {
            var numberRequiredAudio = TranslationStatusService
              .getExplorationAudioRequiredCount();
            var notAvailable = TranslationStatusService
              .getExplorationAudioNotAvailableCount();
            var progressPercent = (
              100 - (notAvailable / numberRequiredAudio) * 100);
            return {width: progressPercent + '%'};
          };

          $scope.changeTranslationLanguage = function() {
            if ($scope.isTranslationTabBusy) {
              $scope.languageCode = $window.localStorage.getItem(
                LAST_SELECTED_TRANSLATION_LANGUAGE);
              $rootScope.$broadcast('showTranslationTabBusyModal');
              return;
            }
            TranslationLanguageService.setActiveLanguageCode(
              $scope.languageCode);
            $rootScope.$broadcast('refreshAudioTranslationBar');
            $window.localStorage.setItem(
              LAST_SELECTED_TRANSLATION_LANGUAGE, $scope.languageCode);
          };
        }
      ]
    };
  }]);
