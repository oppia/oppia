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

require('components/ck-editor-helpers/ck-editor-4-rte.directive.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('directives/mathjax-bind.directive.ts');
require(
  'pages/community-dashboard-page/opportunities-list/' +
  'opportunities-list.directive.ts');

require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require('pages/community-dashboard-page/services/translate-text.service.ts');
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
        '$scope', '$uibModal', 'ContributionOpportunitiesService',
        'TranslateTextService', 'TranslationLanguageService', 'UserService',
        function(
            $scope, $uibModal, ContributionOpportunitiesService,
            TranslateTextService, TranslationLanguageService, UserService) {
          var ctrl = this;
          var userIsLoggedIn = false;
          ctrl.opportunities = [];
          ctrl.opportunitiesAreLoading = true;
          ctrl.moreOpportunitiesAvailable = true;
          ctrl.progressBarRequired = true;

          UserService.getUserInfoAsync().then(function(userInfo) {
            userIsLoggedIn = userInfo.isLoggedIn();
          });

          var getOpportunitySummary = function(expId) {
            for (var index in ctrl.opportunities) {
              if (ctrl.opportunities[index].id === expId) {
                return ctrl.opportunities[index];
              }
            }
          };

          var updateWithNewOpportunities = function(opportunities, more) {
            for (var index in opportunities) {
              var opportunity = opportunities[index];
              var subheading = opportunity.getOpportunitySubheading();
              var heading = opportunity.getOpportunityHeading();
              var totalContentCount = opportunity.getContentCount();
              var languageCode = (
                TranslationLanguageService.getActiveLanguageCode());
              var languageDescription = (
                TranslationLanguageService.getActiveLanguageDescription());
              var progressPercentage = (
                opportunity.getTranslationProgressPercentage(languageCode));

              ctrl.opportunities.push({
                id: opportunity.getExplorationId(),
                heading: heading,
                subheading: subheading,
                progressPercentage: progressPercentage.toFixed(2),
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

          ctrl.onClickButton = function(expId) {
            var opportunity = getOpportunitySummary(expId);
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/community-dashboard-page/modal-templates/' +
                'translation-modal.directive.html'),
              backdrop: 'static',
              size: 'lg',
              resolve: {
                opportunity: function() {
                  return opportunity;
                },
                userIsLoggedIn: function() {
                  return userIsLoggedIn;
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'opportunity', 'userIsLoggedIn',
                function(
                    $scope, $uibModalInstance, opportunity, userIsLoggedIn) {
                  $scope.userIsLoggedIn = userIsLoggedIn;
                  $scope.uploadingTranslation = false;
                  $scope.activeWrittenTranslation = {};
                  $scope.activeWrittenTranslation.html = '';
                  $scope.HTML_SCHEMA = {
                    type: 'html',
                    ui_config: {
                      hide_complex_extensions: 'true'
                    }
                  };
                  $scope.subheading = opportunity.subheading;
                  $scope.heading = opportunity.heading;
                  $scope.loadingData = true;
                  $scope.moreAvailable = false;
                  $scope.textToTranslate = '';
                  $scope.languageDescription = (
                    TranslationLanguageService.getActiveLanguageDescription());
                  TranslateTextService.init(
                    opportunity.id,
                    TranslationLanguageService.getActiveLanguageCode(),
                    function() {
                      var textAndAvailability = (
                        TranslateTextService.getTextToTranslate());
                      $scope.textToTranslate = textAndAvailability.text;
                      $scope.moreAvailable = textAndAvailability.more;
                      $scope.loadingData = false;
                    });
                  $scope.skipActiveTranslation = function() {
                    $scope.textToTranslate = (
                      TranslateTextService.getTextToTranslate().text);
                    $scope.activeWrittenTranslation.html = '';
                  };
                  $scope.suggestTranslatedText = function() {
                    if (!$scope.uploadingTranslation && !$scope.loadingData) {
                      $scope.uploadingTranslation = true;
                      TranslateTextService.suggestTranslatedText(
                        $scope.activeWrittenTranslation.html,
                        TranslationLanguageService.getActiveLanguageCode(),
                        function() {
                          if ($scope.moreAvailable) {
                            var textAndAvailability = (
                              TranslateTextService.getTextToTranslate());
                            $scope.textToTranslate = textAndAvailability.text;
                            $scope.moreAvailable = textAndAvailability.more;
                          }
                          $scope.activeWrittenTranslation.html = '';
                          $scope.uploadingTranslation = false;
                        });
                    }
                    if (!$scope.moreAvailable) {
                      $uibModalInstance.dismiss('ok');
                    }
                  };
                  $scope.done = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  $scope.ok = function() {
                    $uibModalInstance.dismiss('ok');
                  };
                }
              ]
            });
          };

          ContributionOpportunitiesService.getTranslationOpportunities(
            TranslationLanguageService.getActiveLanguageCode(),
            updateWithNewOpportunities);
        }
      ]
    };
  }]);
