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

oppia.constant('SUPPORTED_LANGUAGES', {
  'en': 'English',
  'es': 'Español'
});

oppia.controller('I18nFooter', [
    '$scope', '$translate', 'SUPPORTED_LANGUAGES',
    function($scope, $translate, SUPPORTED_LANGUAGES) {
  $scope.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
  // Changes the language of the translations.
  $scope.changeLanguage = function (langCode) {
    $translate.use(langCode);
  };
}]);

oppia.config([
    '$translateProvider', '$translatePartialLoaderProvider',
    function($translateProvider, $translatePartialLoaderProvider) {
  $translateProvider.useLoader('$translatePartialLoader', {
    urlTemplate: '/i18n/{part}/{lang}.json'
  });
  $translatePartialLoaderProvider.addPart('sidenav');
  $translatePartialLoaderProvider.addPart('topnav');
  $translateProvider.preferredLanguage('en');
  $translateProvider.fallbackLanguage('en');
}]);
