// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the Create Exploration/Collection button.
 */

oppia.directive('createActivityButton', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/create_button/create_activity_button_directive.html'),
      controller: [
        '$scope', '$timeout', '$window', '$uibModal',
        'ExplorationCreationService', 'CollectionCreationService',
        'siteAnalyticsService', 'UrlService',
        function(
            $scope, $timeout, $window, $uibModal, ExplorationCreationService,
            CollectionCreationService, siteAnalyticsService, UrlService) {
          $scope.creationInProgress = false;

          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;
          $scope.allowYamlFileUpload = GLOBALS.allowYamlFileUpload;

          $scope.showUploadExplorationModal = (
            ExplorationCreationService.showUploadExplorationModal);

          $scope.onRedirectToLogin = function(destinationUrl) {
            siteAnalyticsService.registerStartLoginEvent(
              'createActivityButton');
            $timeout(function() {
              $window.location = destinationUrl;
            }, 150);
            return false;
          };

          $scope.initCreationProcess = function() {
            // Without this, the modal keeps reopening when the window is
            // resized.
            if ($scope.creationInProgress) {
              return;
            }

            $scope.creationInProgress = true;

            if (!GLOBALS.can_create_collections) {
              ExplorationCreationService.createNewExploration();
            } else if (UrlService.getPathname() !== '/creator_dashboard') {
              $window.location.replace('/creator_dashboard?mode=create');
            } else {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/creator_dashboard/' +
                  'create_activity_modal_directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance',
                  function($scope, $uibModalInstance) {
                    $scope.chooseExploration = function() {
                      ExplorationCreationService.createNewExploration();
                      $uibModalInstance.close();
                    };

                    $scope.chooseCollection = function() {
                      CollectionCreationService.createNewCollection();
                      $uibModalInstance.close();
                    };

                    $scope.canCreateCollections = (
                      GLOBALS.can_create_collections
                    );

                    $scope.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };

                    $scope.explorationImgUrl = (
                      UrlInterpolationService.getStaticImageUrl(
                        '/activity/exploration.svg'));

                    $scope.collectionImgUrl = (
                      UrlInterpolationService.getStaticImageUrl(
                        '/activity/collection.svg'));
                  }],
                windowClass: 'oppia-creation-modal'
              }).result.then(function() {}, function() {
                $scope.creationInProgress = false;
              });
            }
          };

          // If the user clicked on a 'create' button to get to the dashboard,
          // open the create modal immediately (or redirect to the exploration
          // editor if the create modal does not need to be shown).
          if (UrlService.getUrlParams().mode === 'create') {
            if (!GLOBALS.can_create_collections) {
              ExplorationCreationService.createNewExploration();
            } else {
              $scope.initCreationProcess();
            }
          }
        }
      ]
    };
  }]);
