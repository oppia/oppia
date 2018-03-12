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

oppia.directive('adminNavbar', [
  'AdminRouterService', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
  'PROFILE_URL_TEMPLATE',
  function(
      AdminRouterService, UrlInterpolationService, ADMIN_TAB_URLS,
      PROFILE_URL_TEMPLATE) {
    return {
      restrict: 'E',
      scope: {
        getUsername: '&username',
        getUserEmail: '&userEmail',
        getProfilePictureDataUrl: '&profilePictureDataUrl',
        isModerator: '&isModerator',
        isSuperAdmin: '&isSuperAdmin',
        getLogoutUrl: '&logoutUrl'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin/' +
        'admin_navbar_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
        $scope.showTab = AdminRouterService.showTab;
        $scope.isActivitiesTabOpen = AdminRouterService.isActivitiesTabOpen;
        $scope.isJobsTabOpen = AdminRouterService.isJobsTabOpen;
        $scope.isConfigTabOpen = AdminRouterService.isConfigTabOpen;
        $scope.isRolesTabOpen = AdminRouterService.isRolesTabOpen;
        $scope.isMiscTabOpen = AdminRouterService.isMiscTabOpen;

        $scope.logoWhiteImgUrl = UrlInterpolationService.getStaticImageUrl(
          '/logo/288x128_logo_white.png');

        $scope.profileDropdownIsActive = false;
        $scope.onMouseoverProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().addClass('open');
          $scope.profileDropdownIsActive = true;
        };

        $scope.onMouseoutProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().removeClass('open');
          $scope.profileDropdownIsActive = false;
        };

        $scope.getProfileUrl = function() {
          return UrlInterpolationService.interpolateUrl(PROFILE_URL_TEMPLATE, {
            username: $scope.getUsername()
          });
        };
      }]
    };
  }
]);
