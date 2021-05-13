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

require('services/translation-file-hash-loader-backend-api.service.ts');

angular.module('oppia').directive('i18nFooter', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./i18n-footer.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$rootScope', '$translate',
        'I18nLanguageCodeService', 'UserService',
        'SUPPORTED_SITE_LANGUAGES',
        function(
            $http, $rootScope, $translate,
            I18nLanguageCodeService, UserService,
            SUPPORTED_SITE_LANGUAGES) {
          var ctrl = this;
          // Changes the language of the translations.
          var siteLanguageUrl = '/save_site_language';
          ctrl.changeLanguage = function() {
            $translate.use(ctrl.currentLanguageCode);
            I18nLanguageCodeService.setI18nLanguageCode(
              ctrl.currentLanguageCode);
            UserService.getUserInfoAsync().then(function(userInfo) {
              if (userInfo.isLoggedIn()) {
                $http.put(siteLanguageUrl, {
                  site_language_code: ctrl.currentLanguageCode
                });
              }
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the controller is migrated to angular.
              $rootScope.$applyAsync();
            });
          };
          ctrl.$onInit = function() {
            ctrl.supportedSiteLanguages = SUPPORTED_SITE_LANGUAGES;
            ctrl.currentLanguageCode = (
              $translate.proposedLanguage() || $translate.use());
            I18nLanguageCodeService.setI18nLanguageCode(
              ctrl.currentLanguageCode);
          };
        }
      ]
    };
  }]);

angular.module('oppia').factory(
  'customInterpolation', ['$translateDefaultInterpolation',
    '$translateMessageFormatInterpolation',
    function(
        $translateDefaultInterpolation, $translateMessageFormatInterpolation) {
      let templateMatcher: RegExp = /{{\s?([^{}\s]*)\s?}}/g;

      let interpolateBraces = function(expr: string | Function, params):
       string {
        let result: string;

        if (typeof expr === 'string') {
          result = interpolateString(expr, params);
        } else if (typeof expr === 'function') {
          result = interpolateFunction(expr, params);
        } else {
          // This should not happen, but an unrelated TranslateService test
          // depends on it
          result = expr as string;
        }

        return result;
      };

      let interpolateFunction = function(fn: Function, params?) {
        return fn(params);
      };

      let interpolateString = function(expr: string, params?) {
        if (!params) {
          return expr;
        }

        return expr.replace(
          templateMatcher, (substring: string, b: string) => {
            let r = getValue(params, b);
            return r ? r : substring;
          });
      };

      let getValue = function(target, key: string) {
        let keys = typeof key === 'string' ? key.split('.') : [key];
        key = '';
        do {
          key += keys.shift();
          if (target && target[key] &&
            (typeof target[key] === 'object' || !keys.length)) {
            target = target[key];
            key = '';
          } else if (!keys.length) {
            target = undefined;
          } else {
            key += '.';
          }
        } while (keys.length);

        return target;
      };

      return {
        setLocale: function(locale) {
          $translateDefaultInterpolation.setLocale(locale);
        },

        getInterpolationIdentifier: function() {
          return $translateDefaultInterpolation.getInterpolationIdentifier();
        },

        interpolate: function(
            string, interpolateParams, context,
            sanitizeStrategy, translationId) {
          let interpolate = $translateDefaultInterpolation.interpolate(string,
            interpolateParams, context, sanitizeStrategy, translationId);
          interpolate = interpolateBraces(interpolate, interpolateParams);
          return $translateMessageFormatInterpolation.interpolate(
            interpolate, interpolateParams, context, sanitizeStrategy);
        }
      };
    }]);

angular.module('oppia').config([
  '$translateProvider', 'DEFAULT_TRANSLATIONS', 'SUPPORTED_SITE_LANGUAGES',
  function($translateProvider, DEFAULT_TRANSLATIONS, SUPPORTED_SITE_LANGUAGES) {
    var availableLanguageKeys = [];
    var availableLanguageKeysMap = {};
    SUPPORTED_SITE_LANGUAGES.forEach(function(language) {
      availableLanguageKeys.push(language.id);
      availableLanguageKeysMap[language.id + '*'] = language.id;
    });
    availableLanguageKeysMap['*'] = 'en';

    $translateProvider
      .registerAvailableLanguageKeys(
        availableLanguageKeys, availableLanguageKeysMap)
      .useLoader('TranslationFileHashLoaderBackendApiService', {
        prefix: '/i18n/',
        suffix: '.json'
      })
      // The use of default translation improves the loading time when English
      // is selected.
      .translations('en', DEFAULT_TRANSLATIONS)
      .fallbackLanguage('en')
      .determinePreferredLanguage()
      .useCookieStorage()
      .useInterpolation('customInterpolation')
      // The strategy 'sanitize' does not support utf-8 encoding.
      // https://github.com/angular-translate/angular-translate/issues/1131
      // The strategy 'escape' will brake strings with raw html, like
      // hyperlinks.
      .useSanitizeValueStrategy('sanitizeParameters')
      .forceAsyncReload(true);
  }
]);
