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
 * @fileoverview Directive for the translation opportunities.
 */

require(
  'pages/community-dashboard-page/opportunities-list/' +
  'opportunities-list.directive.ts');

require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');

angular.module('oppia').directive(
  'translationOpportunities', ['UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/translation-opportunities/' +
      'translation-opportunities.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'ContributionOpportunitiesService',
        'TranslationLanguageService', function(
            $scope, ContributionOpportunitiesService,
            TranslationLanguageService) {
          var ctrl = this;
          ctrl.opportunities = [];
          ctrl.opportunitiesAreLoading = true;
          ctrl.moreOpportunitiesAvailable = true;
          var updateWithNewOpportunities = function(opportunities, more) {
            for (var index in opportunities) {
              var opportunity = opportunities[index];
              var subheading = (
                opportunity.topic_name + ' - ' + opportunity.story_title);
              var heading = opportunity.chapter_title;
              var progressPercentage = '0.00';
              var totalContentCount = opportunity.content_count;
              var languageCode = (
                TranslationLanguageService.getActiveLanguageCode());
              var languageDescription = (
                TranslationLanguageService.getActiveLanguageDescription());
              if (
                opportunity.translation_counts.hasOwnProperty(languageCode) && (
                  totalContentCount > 0)) {
                var progressPercentage = (
                  (opportunity.translation_counts[languageCode] /
                    totalContentCount) * 100).toFixed(2);
              }
              ctrl.opportunities.push({
                heading: heading,
                subheading: subheading,
                progressPercentage: progressPercentage,
                actionButtonTitle: 'Translate'
              });
            }
            ctrl.moreOpportunitiesAvailable = more;
            ctrl.opportunitiesAreLoading = false;
          };

          $scope.$on('activeLanguageChanged', function() {
            ctrl.opportunities = [];
            ctrl.opportunitiesAreLoading = true;
            ctrl.moreOpportunitiesAvailable = true;
            ContributionOpportunitiesService.getTranslationOpportunities(
              TranslationLanguageService.getActiveLanguageCode(),
              updateWithNewOpportunities);
          });

          ctrl.onLoadMoreOpportunities = function() {
            if (
              !ctrl.opportunitiesAreLoading &&
                ctrl.moreOpportunitiesAvailable) {
              ctrl.opportunitiesAreLoading = true;
              ContributionOpportunitiesService.getMoreTranslationOpportunities(
                TranslationLanguageService.getActiveLanguageCode(),
                updateWithNewOpportunities);
            }
          };

          ContributionOpportunitiesService.getTranslationOpportunities(
            TranslationLanguageService.getActiveLanguageCode(),
            updateWithNewOpportunities);
        }
      ]
    };
  }]);
