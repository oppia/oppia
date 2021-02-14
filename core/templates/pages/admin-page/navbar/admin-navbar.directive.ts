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
 * @fileoverview Directive for the navigation bar in the admin panel.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-router.service.ts');
require('services/user.service.ts');

require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminNavbar', [
  'AdminRouterService', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
  'LOGOUT_URL', 'PROFILE_URL_TEMPLATE',
  function(
      AdminRouterService, UrlInterpolationService, ADMIN_TAB_URLS,
      LOGOUT_URL, PROFILE_URL_TEMPLATE) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/navbar/admin-navbar.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$rootScope', 'UserService',
        function($rootScope, UserService) {
          var ctrl = this;
          ctrl.showTab = function() {
            return AdminRouterService.showTab();
          };
          ctrl.isActivitiesTabOpen = function() {
            return AdminRouterService.isActivitiesTabOpen();
          };
          ctrl.isJobsTabOpen = function() {
            return AdminRouterService.isJobsTabOpen();
          };
          ctrl.isConfigTabOpen = function() {
            return AdminRouterService.isConfigTabOpen();
          };
          ctrl.isFeaturesTabOpen = function() {
            return AdminRouterService.isFeaturesTabOpen();
          };
          ctrl.isRolesTabOpen = function() {
            return AdminRouterService.isRolesTabOpen();
          };
          ctrl.isMiscTabOpen = function() {
            return AdminRouterService.isMiscTabOpen();
          };
          ctrl.activateProfileDropdown = function() {
            return ctrl.profileDropdownIsActive = true;
          };
          ctrl.deactivateProfileDropdown = function() {
            return ctrl.profileDropdownIsActive = false;
          };
          ctrl.activateDropdownMenu = function() {
            return ctrl.dropdownMenuisActive = true;
          };
          ctrl.deactivateDropdownMenu = function() {
            return ctrl.dropdownMenuisActive = false;
          };
          ctrl.$onInit = function() {
            ctrl.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
            UserService.getProfileImageDataUrlAsync().then(
              function(dataUrl) {
                ctrl.profilePictureDataUrl = dataUrl;
                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the controller is migrated to angular.
                $rootScope.$applyAsync();
              });

            ctrl.getStaticImageUrl = function(imagePath) {
              return UrlInterpolationService.getStaticImageUrl(imagePath);
            };

            ctrl.username = '';
            ctrl.isModerator = null;
            ctrl.isSuperAdmin = null;
            ctrl.profileUrl = '';
            UserService.getUserInfoAsync().then(function(userInfo) {
              ctrl.username = userInfo.getUsername();
              ctrl.isModerator = userInfo.isModerator();
              ctrl.isSuperAdmin = userInfo.isSuperAdmin();

              ctrl.profileUrl = (
                UrlInterpolationService.interpolateUrl(PROFILE_URL_TEMPLATE, {
                  username: ctrl.username
                })
              );
              // TODO(#8521): Remove the use of $rootScope.$apply()
              // once the controller is migrated to angular.
              $rootScope.$applyAsync();
            });

            ctrl.logoutUrl = LOGOUT_URL;

            ctrl.profileDropdownIsActive = false;
            ctrl.dropdownMenuisActive = false;
          };
        }]
    };
  }
]);
