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
  'components/forms/custom-forms-directives/audio-file-uploader.directive.ts');
require(
  'pages/community-dashboard-page/opportunities-list/' +
  'opportunities-list.directive.ts');

require(
  'pages/community-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require(
  'pages/community-dashboard-page/services/voiceover-application.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').directive('voiceoverOpportunities', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/community-dashboard-page/voiceover-opportunities/' +
      'voiceover-opportunities.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$uibModal', 'AlertsService',
        'ContributionOpportunitiesService', 'TranslationLanguageService',
        'UserService', 'VoiceoverApplicationService', function(
            $scope, $uibModal, AlertsService,
            ContributionOpportunitiesService, TranslationLanguageService,
            UserService, VoiceoverApplicationService) {
          var ctrl = this;
          var userIsLoggedIn = false;
          ctrl.opportunities = [];
          ctrl.opportunitiesAreLoading = true;
          ctrl.moreOpportunitiesAvailable = true;
          ctrl.progressBarRequired = false;


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
              var subheading = (
                opportunity.topic_name + ' - ' + opportunity.story_title);
              var heading = opportunity.chapter_title;

              ctrl.opportunities.push({
                id: opportunity.id,
                heading: heading,
                subheading: subheading,
                actionButtonTitle: 'Request to Voiceover'
              });
            }
            ctrl.moreOpportunitiesAvailable = more;
            ctrl.opportunitiesAreLoading = false;
          };

          $scope.$on('activeLanguageChanged', function() {
            ctrl.opportunities = [];
            ctrl.opportunitiesAreLoading = true;
            ContributionOpportunitiesService.getVoiceoverOpportunities(
              TranslationLanguageService.getActiveLanguageCode(),
              updateWithNewOpportunities);
          });

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

          ctrl.onClickOpportunityActionButton = function(expId) {
            var opportunity = getOpportunitySummary(expId);
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/community-dashboard-page/modal-templates/' +
                'voiceover-application-modal.directive.html'),
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
                  var ERROR_MESSAGE_BAD_FILE_UPLOAD = (
                    'There was an error uploading the audio file.');
                  var uploadedFile = null;
                  $scope.errorMessage = null;
                  $scope.droppedFile = null;
                  $scope.errorMessage = null;
                  $scope.userIsLoggedIn = userIsLoggedIn;
                  $scope.uploadingVoiceoverApplication = false;
                  $scope.subheading = opportunity.subheading;
                  $scope.heading = opportunity.heading;
                  $scope.loadingData = true;
                  $scope.languageDescription = (
                    TranslationLanguageService.getActiveLanguageDescription());

                  VoiceoverApplicationService.getTextToVoiceover(
                    opportunity.id,
                    TranslationLanguageService.getActiveLanguageCode())
                    .then(function(text) {
                      $scope.textToVoiceover = text;
                      $scope.loadingData = false;
                    }, function(error) {
                      $scope.loadingData = false;
                      $scope.errorMessage = error.data.error;
                    });

                  $scope.isAudioValid = function() {
                    return (
                      uploadedFile !== null &&
                      uploadedFile.size !== null &&
                      uploadedFile.size > 0);
                  };

                  $scope.updateUploadedFile = function(file) {
                    $scope.errorMessage = null;
                    uploadedFile = file;
                  };

                  $scope.clearUploadedFile = function() {
                    $scope.errorMessage = null;
                    uploadedFile = null;
                  };

                  $scope.submitVoiceoverApplication = function() {
                    if ($scope.isAudioValid()) {
                      $scope.uploadingVoiceoverApplication = true;

                      VoiceoverApplicationService.submitApplication(
                        'exploration', opportunity.id, $scope.textToVoiceover,
                        TranslationLanguageService.getActiveLanguageCode(),
                        uploadedFile
                      ).then(function() {
                        AlertsService.addSuccessMessage(
                          'Your application got submitted successfully!');
                        $uibModalInstance.close();
                      }, function(errorResponse) {
                        $scope.errorMessage = (
                          errorResponse.error || ERROR_MESSAGE_BAD_FILE_UPLOAD);
                        uploadedFile = null;
                      });
                    }
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            });
          };

          ContributionOpportunitiesService.getVoiceoverOpportunities(
            TranslationLanguageService.getActiveLanguageCode(),
            updateWithNewOpportunities);
        }
      ]
    };
  }]);
