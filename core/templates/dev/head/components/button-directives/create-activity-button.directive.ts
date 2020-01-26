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

require('components/entity-creation-services/collection-creation.service.ts');
require('components/entity-creation-services/exploration-creation.service.ts');
require('domain/utilities/browser-checker.service.ts');
require('services/contextual/url.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

angular.module('oppia').directive('createActivityButton', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./create-activity-button.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$timeout', '$window', '$uibModal',
        'ExplorationCreationService', 'CollectionCreationService',
        'SiteAnalyticsService', 'UrlService', 'UserService',
        'ALLOW_YAML_FILE_UPLOAD',
        function(
            $timeout, $window, $uibModal,
            ExplorationCreationService, CollectionCreationService,
            SiteAnalyticsService, UrlService, UserService,
            ALLOW_YAML_FILE_UPLOAD) {
          var ctrl = this;
          ctrl.onRedirectToLogin = function(destinationUrl) {
            SiteAnalyticsService.registerStartLoginEvent(
              'createActivityButton');
            $timeout(function() {
              $window.location = destinationUrl;
            }, 150);
            return false;
          };

          ctrl.initCreationProcess = function() {
            // Without this, the modal keeps reopening when the window is
            // resized.
            if (ctrl.creationInProgress) {
              return;
            }

            ctrl.creationInProgress = true;

            if (!ctrl.canCreateCollections) {
              ExplorationCreationService.createNewExploration();
            } else if (UrlService.getPathname() !== '/creator_dashboard') {
              $window.location.replace('/creator_dashboard?mode=create');
            } else {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/creator-dashboard-page/modal-templates/' +
                  'create-activity-modal.directive.html'),
                backdrop: true,
                controller: [
                  '$scope', '$uibModalInstance',
                  function($scope, $uibModalInstance) {
                    UserService.getUserInfoAsync().then(function(userInfo) {
                      $scope.canCreateCollections = (
                        userInfo.canCreateCollections());
                    });

                    $scope.chooseExploration = function() {
                      ExplorationCreationService.createNewExploration();
                      $uibModalInstance.close();
                    };

                    $scope.chooseCollection = function() {
                      CollectionCreationService.createNewCollection();
                      $uibModalInstance.close();
                    };

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
                ctrl.creationInProgress = false;
              });
            }
          };
          ctrl.showUploadExplorationModal = function() {
            ExplorationCreationService.showUploadExplorationModal();
          };
          ctrl.$onInit = function() {
            ctrl.creationInProgress = false;
            ctrl.allowYamlFileUpload = ALLOW_YAML_FILE_UPLOAD;

            ctrl.canCreateCollections = null;
            ctrl.userIsLoggedIn = null;
            UserService.getUserInfoAsync().then(function(userInfo) {
              ctrl.canCreateCollections = userInfo.canCreateCollections();
              ctrl.userIsLoggedIn = userInfo.isLoggedIn();
            });
            // If the user clicked on a 'create' button to get to the dashboard,
            // open the create modal immediately (or redirect to the exploration
            // editor if the create modal does not need to be shown).
            if (UrlService.getUrlParams().mode === 'create') {
              if (!ctrl.canCreateCollections) {
                ExplorationCreationService.createNewExploration();
              } else {
                ctrl.initCreationProcess();
              }
            }
          };
        }
      ]
    };
  }]);
