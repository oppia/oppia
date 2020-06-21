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
      bindToController: {
        getUserEmail: '&userEmail'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/navbar/admin-navbar.directive.html'),
      controllerAs: '$ctrl',
      controller: ['UserService', function(UserService) {
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
        ctrl.isRolesTabOpen = function() {
          return AdminRouterService.isRolesTabOpen();
        };
        ctrl.isMiscTabOpen = function() {
          return AdminRouterService.isMiscTabOpen();
        };
        ctrl.onMouseoverProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().addClass('open');
          ctrl.profileDropdownIsActive = true;
        };

        ctrl.onMouseoutProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().removeClass('open');
          ctrl.profileDropdownIsActive = false;
        };
        ctrl.onMouseoverDropdownIconOrMenu = function(evt) {
          angular.element(evt.currentTarget).parent().addClass('open');
          ctrl.dropdownMenuisActive = true;
        };

        ctrl.onMouseoutDropdownIconOrMenu = function(evt) {
          angular.element(evt.currentTarget).parent().removeClass('open');
          ctrl.dropdownMenuisActive = false;
        };

        ctrl.$onInit = function() {
          ctrl.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
          UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
            ctrl.profilePictureDataUrl = dataUrl;
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
          });

          ctrl.logoutUrl = LOGOUT_URL;

          ctrl.profileDropdownIsActive = false;
          ctrl.dropdownMenuisActive = false;
        };
      }]
    };
  }
]);
