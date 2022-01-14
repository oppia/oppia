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
 * @fileoverview Component for the contributor dashboard page.
 */

require('base-components/base-content.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'lazy-loading.component.ts');
require(
  'pages/contributor-dashboard-page/contributions-and-review/' +
  'contributions-and-review.component.ts');
require(
  'pages/contributor-dashboard-page/translation-language-selector/' +
  'translation-language-selector.component.ts');
require(
  'pages/contributor-dashboard-page/translation-topic-selector/' +
  'translation-topic-selector.component.ts');
require(
  'pages/contributor-dashboard-page/question-opportunities/' +
  'question-opportunities.component.ts');
require(
  'pages/contributor-dashboard-page/translation-opportunities/' +
  'translation-opportunities.component.ts');
require('services/stateful/focus-manager.service.ts');
require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/local-storage.service.ts');
require('services/user.service.ts');

require(
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/contributor-dashboard-page.constants.ajs.ts');

angular.module('oppia').component('contributorDashboardPage', {
  template: require('./contributor-dashboard-page.component.html'),
  controller: [
    '$rootScope', '$timeout', 'ContributionOpportunitiesService',
    'FocusManagerService', 'LanguageUtilService', 'LocalStorageService',
    'TranslationLanguageService', 'TranslationTopicService',
    'UrlInterpolationService', 'UserService', 'WindowRef',
    'CONTRIBUTOR_DASHBOARD_TABS_DETAILS', 'DEFAULT_OPPORTUNITY_TOPIC_NAME',
    'OPPIA_AVATAR_LINK_URL',
    function(
        $rootScope, $timeout, ContributionOpportunitiesService,
        FocusManagerService, LanguageUtilService, LocalStorageService,
        TranslationLanguageService, TranslationTopicService,
        UrlInterpolationService, UserService, WindowRef,
        CONTRIBUTOR_DASHBOARD_TABS_DETAILS, DEFAULT_OPPORTUNITY_TOPIC_NAME,
        OPPIA_AVATAR_LINK_URL) {
      var ctrl = this;


      var getLanguageDescriptions = function(languageCodes) {
        var languageDescriptions = [];
        languageCodes.forEach(function(languageCode) {
          languageDescriptions.push(
            LanguageUtilService.getAudioLanguageDescription(
              languageCode));
        });
        return languageDescriptions;
      };

      ctrl.languageCode = TranslationLanguageService.getActiveLanguageCode();

      ctrl.onChangeLanguage = function(languageCode: string) {
        ctrl.languageCode = languageCode;
        TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);
        LocalStorageService.updateLastSelectedTranslationLanguageCode(
          ctrl.languageCode);
        $rootScope.$applyAsync();
      };

      ctrl.showLanguageSelector = function() {
        var activeTabDetail = ctrl.tabsDetails[ctrl.activeTabName];
        return activeTabDetail.customizationOptions.includes('language');
      };

      ctrl.onChangeTopic = function(topicName: string) {
        ctrl.topicName = topicName;
        TranslationTopicService.setActiveTopicName(ctrl.topicName);
        LocalStorageService.updateLastSelectedTranslationTopicName(
          ctrl.topicName);
        $rootScope.$applyAsync();
      };

      ctrl.showTopicSelector = function() {
        var activeTabDetail = ctrl.tabsDetails[ctrl.activeTabName];
        return activeTabDetail.customizationOptions.includes('topic');
      };

      ctrl.onTabClick = function(activeTabName) {
        ctrl.activeTabName = activeTabName;
        // The $timeout is required to ensure that focus is applied only
        // after all the functions in main thread have executed.
        if (ctrl.activeTabName === 'translateTextTab') {
          $timeout(() => {
            FocusManagerService.setFocusWithoutScroll('selectLangDropDown');
          }, 5);
        }
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
        ctrl.defaultHeaderVisible = true;

        var prevSelectedTopicName = (
          LocalStorageService.getLastSelectedTranslationTopicName());

        WindowRef.nativeWindow.addEventListener('scroll', function() {
          ctrl.scrollFunction();
        });

        ctrl.scrollFunction = function() {
          if (WindowRef.nativeWindow.pageYOffset >= 5) {
            ctrl.defaultHeaderVisible = false;
          } else {
            ctrl.defaultHeaderVisible = true;
          }
          // TODO(#8521): Remove the use of $rootScope.$apply()
          // once the controller is migrated to angular.
          $rootScope.$applyAsync();
        };

        UserService.getProfileImageDataUrlAsync().then(
          function(dataUrl) {
            ctrl.profilePictureDataUrl = dataUrl;
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });

        UserService.getUserContributionRightsDataAsync().then(
          function(userContributionRights) {
            ctrl.userCanReviewTranslationSuggestionsInLanguages = (
              getLanguageDescriptions(
                userContributionRights
                  .can_review_translation_for_language_codes));

            ctrl.userCanReviewVoiceoverSuggestionsInLanguages = (
              getLanguageDescriptions(
                userContributionRights
                  .can_review_voiceover_for_language_codes));

            ctrl.userCanReviewQuestions = (
              userContributionRights.can_review_questions);

            ctrl.userIsReviewer = (
              ctrl.userCanReviewTranslationSuggestionsInLanguages
                .length > 0 ||
              ctrl.userCanReviewVoiceoverSuggestionsInLanguages
                .length > 0 ||
              ctrl.userCanReviewQuestions);

            ctrl.tabsDetails.submitQuestionTab.enabled = (
              userContributionRights.can_suggest_questions);
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });

        UserService.getUserInfoAsync().then(function(userInfo) {
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
          $rootScope.$applyAsync();
        });

        ctrl.topicName = DEFAULT_OPPORTUNITY_TOPIC_NAME;
        TranslationTopicService.setActiveTopicName(ctrl.topicName);

        ContributionOpportunitiesService.getAllTopicNamesAsync()
          .then(function(topicNames) {
            if (topicNames.indexOf(prevSelectedTopicName) !== -1) {
              ctrl.topicName = prevSelectedTopicName;
              TranslationTopicService.setActiveTopicName(ctrl.topicName);
            }
            $rootScope.$applyAsync();
          });

        ctrl.activeTabName = 'myContributionTab';
        ctrl.tabsDetails = CONTRIBUTOR_DASHBOARD_TABS_DETAILS;
        ctrl.OPPIA_AVATAR_LINK_URL = OPPIA_AVATAR_LINK_URL;
        ctrl.OPPIA_AVATAR_IMAGE_URL = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg'));
      };
    }
  ]
});
