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
 * @fileoverview Directive for the voiceover opportunities.
 */

require(
  'pages/contributor-dashboard-page/opportunities-list/' +
  'opportunities-list.directive.ts');

require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');

angular.module('oppia').directive('voiceoverOpportunities', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/contributor-dashboard-page/translation-opportunities/' +
      'translation-opportunities.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', '$scope', 'ContributionOpportunitiesService',
        'TranslationLanguageService', function(
            $rootScope, $scope, ContributionOpportunitiesService,
            TranslationLanguageService) {
          var ctrl = this;
          var updateWithNewOpportunities = function(opportunities, more) {
            for (var index in opportunities) {
              var opportunity = opportunities[index];
              var subheading = opportunity.getOpportunitySubheading();
              var heading = opportunity.getOpportunityHeading();

              ctrl.opportunities.push({
                heading: heading,
                subheading: subheading,
                actionButtonTitle: 'Request to Voiceover'
              });
            }
            ctrl.moreOpportunitiesAvailable = more;
            ctrl.opportunitiesAreLoading = false;
            // TODO(#8521): Remove the use of $rootScope.$apply().
            $rootScope.$apply();
          };

          ctrl.onLoadMoreOpportunities = function() {
            if (
              !ctrl.opportunitiesAreLoading &&
              ctrl.moreOpportunitiesAvailable) {
              ctrl.opportunitiesAreLoading = true;
              ContributionOpportunitiesService.getMoreVoiceoverOpportunities(
                TranslationLanguageService.getActiveLanguageCode(),
                updateWithNewOpportunities);
            }
          };
          ctrl.$onInit = function() {
            $scope.$on('activeLanguageChanged', function() {
              ctrl.opportunities = [];
              ctrl.opportunitiesAreLoading = true;
              ContributionOpportunitiesService.getVoiceoverOpportunities(
                TranslationLanguageService.getActiveLanguageCode(),
                updateWithNewOpportunities);
            });
            ctrl.opportunities = [];
            ctrl.opportunitiesAreLoading = true;
            ctrl.moreOpportunitiesAvailable = true;
            ctrl.progressBarRequired = false;
            ContributionOpportunitiesService.getVoiceoverOpportunities(
              TranslationLanguageService.getActiveLanguageCode(),
              updateWithNewOpportunities);
          };
        }
      ]
    };
  }]);
