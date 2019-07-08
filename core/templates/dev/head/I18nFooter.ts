// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Translation functions for Oppia.
 *
 * @author milagro.teruel@gmail.com (Milagro Teruel)
 */

var oppia = require('AppInit.ts').module;

oppia.controller('I18nFooter', [
  '$cookies', '$http', '$rootScope', '$scope', '$timeout', '$translate',
  'UserService',
  function(
      $cookies, $http, $rootScope, $scope, $timeout, $translate,
      UserService) {
    // Changes the language of the translations.
    var preferencesDataUrl = '/preferenceshandler/data';
    var siteLanguageUrl = '/save_site_language';
    $scope.supportedSiteLanguages = constants.SUPPORTED_SITE_LANGUAGES;

    // The $timeout seems to be necessary for the dropdown to show anything
    // at the outset, if the default language is not English.
    $timeout(function() {
      // $translate.use() returns undefined until the language file is fully
      // loaded, which causes a blank field in the dropdown, hence we use
      // $translate.proposedLanguage() as suggested in
      // http://stackoverflow.com/a/28903658
      $scope.currentLanguageCode = $translate.use() ||
        $translate.proposedLanguage();
    }, 50);

    $scope.changeLanguage = function() {
      $translate.use($scope.currentLanguageCode);
      UserService.getUserInfoAsync().then(function(userInfo) {
        if (userInfo.isLoggedIn()) {
          $http.put(siteLanguageUrl, {
            site_language_code: $scope.currentLanguageCode
          });
        }
      });
    };
  }
]);

oppia.config([
  '$translateProvider', 'DEFAULT_TRANSLATIONS',
  function($translateProvider, DEFAULT_TRANSLATIONS) {
    var availableLanguageKeys = [];
    var availableLanguageKeysMap = {};
    constants.SUPPORTED_SITE_LANGUAGES.forEach(function(language) {
      availableLanguageKeys.push(language.id);
      availableLanguageKeysMap[language.id + '*'] = language.id;
    });
    availableLanguageKeysMap['*'] = 'en';

    $translateProvider
      .registerAvailableLanguageKeys(
        availableLanguageKeys, availableLanguageKeysMap)
      .useLoader('TranslationFileHashLoaderService', {
        prefix: '/i18n/',
        suffix: '.json'
      })
      // The use of default translation improves the loading time when English
      // is selected
      .translations('en', DEFAULT_TRANSLATIONS)
      .fallbackLanguage('en')
      .determinePreferredLanguage()
      .useCookieStorage()
      // The messageformat interpolation method is necessary for pluralization.
      // Is optional and should be passed as argument to the translate call. See
      // https://angular-translate.github.io/docs/#/guide/14_pluralization
      .addInterpolation('$translateMessageFormatInterpolation')
      // The strategy 'sanitize' does not support utf-8 encoding.
      // https://github.com/angular-translate/angular-translate/issues/1131
      // The strategy 'escape' will brake strings with raw html, like hyperlinks
      .useSanitizeValueStrategy('sanitizeParameters')
      .forceAsyncReload(true);
  }
]);
