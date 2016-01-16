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

// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
var defaultTranslations = {
  'I18N_GALLERY_PAGE_TITLE': 'Gallery',
  'I18N_GALLERY_PAGE_SUBTITLE': 'Oppia',
  'I18N_GALLERY_LOADING': 'Loading',
  'I18N_SIGNUP_PAGE_SUBTITLE': 'Registration',
  'I18N_SIGNUP_PAGE_TITLE': 'Oppia',
  'I18N_GALLERY_SEARCH_PLACEHOLDER': 'What are you curious about?',
  'I18N_GALLERY_ALL_LANGUAGES': 'All Languages',
  'I18N_GALLERY_LANGUAGES_EN': 'English',
  'I18N_GALLERY_ALL_CATEGORIES': 'All Categories',
  'I18N_GALLERY_CREATE_EXPLORATION': 'Create exploration',
  'I18N_SIDEBAR_HOME_LINK': 'Home',
  'I18N_SIDEBAR_HOME_ABOUT': 'About',
  'I18N_SIDEBAR_PARTICIPATION_PLAYBOOK': 'Participation Playbook',
  'I18N_SIDEBAR_FORUM': 'Forum',
  'I18N_SIDEBAR_FOLLOW_US': 'Follow Us',
  'I18N_SIDEBAR_ADDITIONAL_LINK_SITE_FEEDBACK': 'Site Feedback',
  'I18N_TOPNAV_SIGN_IN': 'Sign in',
  'I18N_SIGNUP_REGISTRATION': 'Registration',
  'I18N_SIGNUP_LOADING': 'Loading'
};

oppia.constant('SUPPORTED_LANGUAGES', {
  'en': 'English',
  'es': 'Español'
});

oppia.controller('I18nFooter', [
    '$rootScope', '$scope', '$translate', 'SUPPORTED_LANGUAGES',
    function($rootScope, $scope, $translate, SUPPORTED_LANGUAGES) {
  $scope.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
  // Changes the language of the translations.
  $scope.changeLanguage = function(langCode) {
    $translate.use(langCode);
  };
  // After loading default translations, change the language for the storaged
  // language if necessary
  $rootScope.$on('$translateLoadingSuccess', function (event, args) {
    var currentLang = $translate.proposedLanguage() || $translate.use();
    $translate.use(currentLang);
  });
}]);

oppia.config([
    '$translateProvider', 'SUPPORTED_LANGUAGES',
    function($translateProvider, SUPPORTED_LANGUAGES) {
  var availableLanguageKeys = [];
  var availableLanguageKeysMap = {};
  for (var prop in SUPPORTED_LANGUAGES) {
    availableLanguageKeys.push(prop);
    availableLanguageKeysMap[prop + '*'] = prop;
  };
  availableLanguageKeysMap['*'] = 'en';
  $translateProvider.registerAvailableLanguageKeys(
    availableLanguageKeys, availableLanguageKeysMap);

  $translateProvider.translations('en', defaultTranslations);
  $translateProvider.fallbackLanguage('en');

  $translateProvider.determinePreferredLanguage();
  $translateProvider.useCookieStorage();

  $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/locale-',
      suffix: '.json'
  });
  $translateProvider.preferredLanguage('en');
  // using strategy 'sanitize' does not support utf-8 encoding.
  // https://github.com/angular-translate/angular-translate/issues/1131
  $translateProvider.useSanitizeValueStrategy('sanitizeParameters');
  $translateProvider.forceAsyncReload(true);
}]);
