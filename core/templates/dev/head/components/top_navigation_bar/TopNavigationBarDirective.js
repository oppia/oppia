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
 * @fileoverview Directive for the top navigation bar.
 */

oppia.directive('topNavigationBar', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'components/topNavigationBar',
    controller: [
      '$scope', '$http', '$window', '$timeout', 'UrlInterpolationService',
      'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS',
      'siteAnalyticsService', 'windowDimensionsService',
      function(
          $scope, $http, $window, $timeout, UrlInterpolationService,
          SidebarStatusService, LABEL_FOR_CLEARING_FOCUS,
          siteAnalyticsService, windowDimensionsService) {
        $scope.NAV_MODE = GLOBALS.NAV_MODE;
        $scope.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

        $scope.onLoginButtonClicked = function(loginUrl) {
          siteAnalyticsService.registerStartLoginEvent('loginButton');
          $timeout(function() {
            $window.location = loginUrl;
          }, 150);
          return false;
        };

        $scope.profileDropdownIsActive = false;
        $scope.onMouseoverProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().addClass('open');
          $scope.profileDropdownIsActive = true;
        };
        $scope.onMouseoutProfilePictureOrDropdown = function(evt) {
          angular.element(evt.currentTarget).parent().removeClass('open');
          $scope.profileDropdownIsActive = false;
        };

        $scope.onMouseoverDropdownMenu = function(evt) {
          angular.element(evt.currentTarget).parent().addClass('open');
        };
        $scope.onMouseoutDropdownMenu = function(evt) {
          angular.element(evt.currentTarget).parent().removeClass('open');
        };

        if (GLOBALS.userIsLoggedIn) {
          // Show the number of unseen notifications in the navbar and page
          // title, unless the user is already on the dashboard page.
          $http.get('/notificationshandler').then(function(response) {
            var data = response.data;
            if ($window.location.pathname !== '/') {
              $scope.numUnseenNotifications = data.num_unseen_notifications;
              if ($scope.numUnseenNotifications > 0) {
                $window.document.title = (
                  '(' + $scope.numUnseenNotifications + ') ' +
                  $window.document.title);
              }
            }
          });
        }

        $scope.windowIsNarrow = windowDimensionsService.isWindowNarrow();
        windowDimensionsService.registerOnResizeHook(function() {
          $scope.windowIsNarrow = windowDimensionsService.isWindowNarrow();
          $scope.$apply();
          // Close the sidebar, if necessary.
          SidebarStatusService.closeSidebar();
        });

        $scope.toggleSidebar = SidebarStatusService.toggleSidebar;

        // TODO(sll): Sort out (Jinja):
        // - username
        // - profile_picture_data_url
        // - is_admin
        // - is_moderator
        // - is_super_admin
        // - logout_url
        // - login_url

        // This method is here because the trigger for the tutorial is in the
        // site navbar. It broadcasts an event to tell the exploration editor
        // to open the editor tutorial.
        $scope.openEditorTutorial = function() {
          $scope.$broadcast('openEditorTutorial');
        };
      }
    ]
  };
}]);
