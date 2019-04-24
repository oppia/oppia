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
      scope: {},
      bindToController: true,
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/create_button/create_activity_button_directive.html'),
      controllerAs: 'create-activity-button-ctrl',
      controller: [
        '$scope', '$timeout', '$window', '$uibModal',
        'ExplorationCreationService', 'CollectionCreationService',
        'SiteAnalyticsService', 'UrlService', 'UserService',
        'ALLOW_YAML_FILE_UPLOAD',
        function(
            $scope, $timeout, $window, $uibModal,
            ExplorationCreationService, CollectionCreationService,
            SiteAnalyticsService, UrlService, UserService,
            ALLOW_YAML_FILE_UPLOAD) {
          this.creationInProgress = false;
          this.allowYamlFileUpload = ALLOW_YAML_FILE_UPLOAD;

          this.canCreateCollections = null;
          this.userIsLoggedIn = null;
          UserService.getUserInfoAsync().then(function(userInfo) {
            this.canCreateCollections = userInfo.canCreateCollections();
            this.userIsLoggedIn = userInfo.isLoggedIn();
          });

          this.showUploadExplorationModal = (
            ExplorationCreationService.showUploadExplorationModal);

          this.onRedirectToLogin = function(destinationUrl) {
            SiteAnalyticsService.registerStartLoginEvent(
              'createActivityButton');
            $timeout(function() {
              $window.location = destinationUrl;
            }, 150);
            return false;
          };

          this.initCreationProcess = function() {
            // Without this, the modal keeps reopening when the window is
            // resized.
            if (this.creationInProgress) {
              return;
            }

            this.creationInProgress = true;

            if (!this.canCreateCollections) {
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
                    UserService.getUserInfoAsync().then(function(userInfo) {
                      this.canCreateCollections = (
                        userInfo.canCreateCollections());
                    });

                    this.chooseExploration = function() {
                      ExplorationCreationService.createNewExploration();
                      $uibModalInstance.close();
                    };

                    this.chooseCollection = function() {
                      CollectionCreationService.createNewCollection();
                      $uibModalInstance.close();
                    };

                    this.cancel = function() {
                      $uibModalInstance.dismiss('cancel');
                    };

                    this.explorationImgUrl = (
                      UrlInterpolationService.getStaticImageUrl(
                        '/activity/exploration.svg'));

                    this.collectionImgUrl = (
                      UrlInterpolationService.getStaticImageUrl(
                        '/activity/collection.svg'));
                  }],
                windowClass: 'oppia-creation-modal'
              }).result.then(function() {}, function() {
                this.creationInProgress = false;
              });
            }
          };

          // If the user clicked on a 'create' button to get to the dashboard,
          // open the create modal immediately (or redirect to the exploration
          // editor if the create modal does not need to be shown).
          if (UrlService.getUrlParams().mode === 'create') {
            if (!this.canCreateCollections) {
              ExplorationCreationService.createNewExploration();
            } else {
              this.initCreationProcess();
            }
          }
        }
      ]
    };
  }]);
