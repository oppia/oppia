// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the community dashboard page.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'lazy-loading.component.ts');
require(
  'pages/community-dashboard-page/contributions-and-review/' +
  'contributions-and-review.directive.ts');
require(
  'pages/community-dashboard-page/translation-language-selector/' +
  'translation-language-selector.component.ts');
require(
  'pages/community-dashboard-page/question-opportunities/' +
  'question-opportunities.directive.ts');
require(
  'pages/community-dashboard-page/translation-opportunities/' +
  'translation-opportunities.directive.ts');
require(
  'pages/community-dashboard-page/voiceover-opportunities/' +
  'voiceover-opportunities.directive.ts');

require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/local-storage.service.ts');
require('services/user-backend-api.service.ts');

require(
  'pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts');

angular.module('oppia').component('communityDashboardPage', {
  template: require('./community-dashboard-page.component.html'),
  controller: [
    '$rootScope', 'LanguageUtilService', 'LocalStorageService',
    'TranslationLanguageService', 'UrlInterpolationService',
    'UserBackendApiService', 'COMMUNITY_DASHBOARD_TABS_DETAILS',
    'DEFAULT_OPPORTUNITY_LANGUAGE_CODE',
    function(
        $rootScope, LanguageUtilService, LocalStorageService,
        TranslationLanguageService, UrlInterpolationService,
        UserBackendApiService, COMMUNITY_DASHBOARD_TABS_DETAILS,
        DEFAULT_OPPORTUNITY_LANGUAGE_CODE) {
      var ctrl = this;

      var prevSelectedLanguageCode = (
        LocalStorageService.getLastSelectedTranslationLanguageCode());
      var allAudioLanguageCodes = (
        LanguageUtilService.getAllVoiceoverLanguageCodes());

      var getLanguageDescriptions = function(languageCodes) {
        var languageDescriptions = [];
        languageCodes.forEach(function(languageCode) {
          languageDescriptions.push(
            LanguageUtilService.getAudioLanguageDescription(
              languageCode));
        });
        return languageDescriptions;
      };

      ctrl.onChangeLanguage = function(languageCode: string) {
        ctrl.languageCode = languageCode;
        TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);
        LocalStorageService.updateLastSelectedTranslationLanguageCode(
          ctrl.languageCode);
      };

      ctrl.showLanguageSelector = function() {
        var activeTabDetail = ctrl.tabsDetails[ctrl.activeTabName];
        return (
          activeTabDetail.customizationOptions.indexOf('language') !== -1);
      };
      ctrl.onTabClick = function(activeTabName) {
        ctrl.activeTabName = activeTabName;
      };
      ctrl.$onInit = function() {
        ctrl.profilePictureDataUrl = null;
        ctrl.username = null;
        ctrl.userInfoIsLoading = true;
        ctrl.userIsLoggedIn = false;
        ctrl.userIsReviewer = false;
        ctrl.userCanReviewTranslationSuggestionsInLanguages = [];
        ctrl.userCanReviewVoiceoverSuggestionsInLanguages = [];
        ctrl.userCanReviewQuestions = false;

        UserBackendApiService.getProfileImageDataUrlAsync().then(
          function(dataUrl) {
            ctrl.profilePictureDataUrl = dataUrl;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$apply();
          });

        UserBackendApiService.getUserCommunityRightsData().then(
          function(userCommunityRights) {
            ctrl.userCanReviewTranslationSuggestionsInLanguages = (
              getLanguageDescriptions(
                userCommunityRights
                  .can_review_translation_for_language_codes));

            ctrl.userCanReviewVoiceoverSuggestionsInLanguages = (
              getLanguageDescriptions(
                userCommunityRights
                  .can_review_voiceover_for_language_codes));

            ctrl.userCanReviewQuestions = (
              userCommunityRights.can_review_questions);

            ctrl.userIsReviewer = (
              ctrl.userCanReviewTranslationSuggestionsInLanguages
                .length > 0 ||
              ctrl.userCanReviewVoiceoverSuggestionsInLanguages
                .length > 0 ||
              ctrl.userCanReviewQuestions);
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$apply();
          });

        UserBackendApiService.getUserInfoAsync().then(function(userInfo) {
          ctrl.userInfoIsLoading = false;
          if (userInfo.isLoggedIn()) {
            ctrl.userIsLoggedIn = true;
            ctrl.username = userInfo.getUsername();
          } else {
            ctrl.userIsLoggedIn = false;
            ctrl.username = '';
          }
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$apply();
        });

        ctrl.languageCode = (
          allAudioLanguageCodes.indexOf(prevSelectedLanguageCode) !== -1 ?
          prevSelectedLanguageCode : DEFAULT_OPPORTUNITY_LANGUAGE_CODE);

        TranslationLanguageService.setActiveLanguageCode(
          ctrl.languageCode);

        ctrl.activeTabName = 'myContributionTab';
        ctrl.tabsDetails = COMMUNITY_DASHBOARD_TABS_DETAILS;
        ctrl.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg'));
      };
    }
  ]
});
