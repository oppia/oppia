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
 * @fileoverview Directive for the community dashboard page.
 */

require('base_components/BaseContentDirective.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');
require(
  'pages/community-dashboard-page/translation-opportunities/' +
  'translation-opportunities.directive.ts');
require(
  'pages/community-dashboard-page/voiceover-opportunities/' +
  'voiceover-opportunities.directive.ts');

require('domain/utilities/LanguageUtilService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/LocalStorageService.ts');

require(
  'pages/community-dashboard-page/community-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('communityDashboardPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/' +
      'community-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$window', 'LanguageUtilService', 'LocalStorageService',
        'TranslationLanguageService', 'COMMUNITY_DASHBOARD_TABS_DETAILS',
        'DEFAULT_OPPORTUNITY_LANGUAGE_CODE',
        function(
            $window, LanguageUtilService, LocalStorageService,
            TranslationLanguageService, COMMUNITY_DASHBOARD_TABS_DETAILS,
            DEFAULT_OPPORTUNITY_LANGUAGE_CODE) {
          var ctrl = this;
          var prevSelectedLanguageCode = (
            LocalStorageService.getLastSelectedTranslationLanguageCode());
          var allAudioLanguageCodes = LanguageUtilService
            .getAllVoiceoverLanguageCodes();

          ctrl.languageCodesAndDescriptions = (
            allAudioLanguageCodes.map(function(languageCode) {
              return {
                id: languageCode,
                description: (
                  LanguageUtilService.getAudioLanguageDescription(
                    languageCode))
              };
            }));
          ctrl.languageCode = (
            allAudioLanguageCodes.indexOf(prevSelectedLanguageCode) !== -1 ?
            prevSelectedLanguageCode : DEFAULT_OPPORTUNITY_LANGUAGE_CODE);

          TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);

          ctrl.onChangeLanguage = function() {
            TranslationLanguageService.setActiveLanguageCode(ctrl.languageCode);
            LocalStorageService.updateLastSelectedTranslationLanguageCode(
              ctrl.languageCode);
          };

          ctrl.showLanguageSelector = function() {
            var activeTabDetail = ctrl.tabsDetails[ctrl.activeTabName];
            return (
              activeTabDetail.customizationOptions.indexOf('language') !== -1);
          };

          ctrl.activeTabName = 'myContributionTab';
          ctrl.tabsDetails = COMMUNITY_DASHBOARD_TABS_DETAILS;
          ctrl.OPPIA_AVATAR_IMAGE_URL = (
            UrlInterpolationService.getStaticImageUrl(
              '/avatar/oppia_avatar_100px.svg'));
          ctrl.onTabClick = function(activeTabName) {
            ctrl.activeTabName = activeTabName;
          };
        }
      ]
    };
  }]);
