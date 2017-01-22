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
 * @fileoverview Directive for the top navigation bar. This excludes the part
 * of the navbar that is used for local navigation (such as the various tabs in
 * the editor pages).
 */

oppia.directive('topNavigationBar', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'components/topNavigationBar',
    controller: [
      '$scope', '$http', '$window', '$timeout', 'UrlInterpolationService',
      'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS',
      'siteAnalyticsService', 'windowDimensionsService', 'oppiaDebouncer',
      function(
          $scope, $http, $window, $timeout, UrlInterpolationService,
          SidebarStatusService, LABEL_FOR_CLEARING_FOCUS,
          siteAnalyticsService, windowDimensionsService, oppiaDebouncer) {
        var NAV_MODE_SIGNUP = 'signup';
        var NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
          'create', 'explore', 'collection'];
        $scope.NAV_MODE = GLOBALS.NAV_MODE;
        $scope.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
        $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

        $scope.username = GLOBALS.username;
        $scope.profilePictureDataUrl = GLOBALS.profilePictureDataUrl;
        $scope.isAdmin = GLOBALS.isAdmin;
        $scope.isModerator = GLOBALS.isModerator;
        $scope.isSuperAdmin = GLOBALS.isSuperAdmin;
        $scope.logoutUrl = GLOBALS.logoutUrl;
        if ($scope.username) {
          $scope.profilePageUrl = UrlInterpolationService.interpolateUrl(
            '/profile/<username>', {
              username: $scope.username
            });
        }
        $scope.userMenuIsShown = ($scope.NAV_MODE !== NAV_MODE_SIGNUP);
        $scope.standardNavIsShown = (
          NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf($scope.NAV_MODE) === -1);

        $scope.onLoginButtonClicked = function() {
          siteAnalyticsService.registerStartLoginEvent('loginButton');
          $timeout(function() {
            $window.location = GLOBALS.loginUrl;
          }, 150);
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
        var currentWindowWidth = windowDimensionsService.getWidth();
        $scope.navElementsVisibilityStatus = {
          I18N_TOPNAV_DONATE: true,
          I18N_TOPNAV_ABOUT: true,
          I18N_CREATE_EXPLORATION_CREATE: true,
          I18N_TOPNAV_LIBRARY: true
        };

        windowDimensionsService.registerOnResizeHook(function() {
          $scope.windowIsNarrow = windowDimensionsService.isWindowNarrow();
          $scope.$apply();
          // Close the sidebar, if necessary.
          SidebarStatusService.closeSidebar();

          // If the window is resized larger, try displaying the hidden elements
          if (currentWindowWidth < windowDimensionsService.getWidth()) {
            for(element in $scope.navElementsVisibilityStatus) {
              if (!$scope.navElementsVisibilityStatus[element]) {
                $scope.navElementsVisibilityStatus[element] = true;
              }
            }
          }
          currentWindowWidth = windowDimensionsService.getWidth();
          oppiaDebouncer.debounce(truncateNavbar, 500)();
        });

        /**
         * Checks if i18n has been run.
         * If i18n has not yet run, the <a> and <span> tags will have
         * no text content, so their innerText.length value will be 0.
         * @returns {boolean}
         */
        var checkIfI18NCompleted = function() {
          var i18nCompleted = true;
          $('.oppia-navbar-tabs a[translate], ' +
            '.oppia-navbar-tabs span[translate]').each(function(i, element) {
            if (element.innerText.length === 0) {
              i18nCompleted = false;
              return false;
            }
          });
          return i18nCompleted;
        };

        var calculateNavWidth = function() {
          var navWidth = 0;
          $('ul.oppia-navbar-tabs').children().each(function(i, element) {
            // The "create" button has a 0 width on its top-level element.
            // The <li> tag from the Donate button has a large/invalid width.
            // Use widths of their first-level child elements instead.
            if (element.clientWidth === 0 || element.clientWidth >= 176) {
              $(element).children().each(function(i, element) {
                // Adding a small padding accounts for any unexpected padding
                // or font differences. It may be possible to safely eliminate
                // the extra by using Web Font Loader.
                navWidth += 5;
                navWidth += element.clientWidth;
              });
            } else {
              navWidth += 5;
              navWidth += element.clientWidth;
            }
          });

          // If the user is logged in, add the width of the gravatar section.
          if ($scope.username) {
            navWidth += $('ul.nav.oppia-navbar-profile').width();
          }

          return navWidth;
        };

        /**
         * Sets the min-width for the tabs part of the navbar, then checks
         * for overflow. If overflow is detected hides the least important
         * tab and then calls itself again after a 10ms delay.
         */
        var truncateNavbar = function() {
          console.log('Called at', Date.now());
          // If the window is narrow, the standard nav tabs are not shown.
          if (windowDimensionsService.isWindowNarrow()) {
            return false;
          }

          // If i18n hasn't completed, retry after 100ms.
          if (!checkIfI18NCompleted()) {
            $timeout(truncateNavbar, 100);
            return false;
          }

          $('ul.nav.oppia-navbar-tabs').css('min-width', calculateNavWidth());

          // Measured non-overflowed navbar height under 60px via inspector.
          if ($('div.collapse.navbar-collapse').height() > 60) {
            for (element in $scope.navElementsVisibilityStatus) {
              if ($scope.navElementsVisibilityStatus[element]) {
                // Hide one element, then check again after 10ms.
                // This gives the browser time to render the visibility change.
                $scope.navElementsVisibilityStatus[element] = false;
                $timeout(truncateNavbar, 10);
                return false;
              }
            }
          }
        };

        // For Chrome, timeout 0 appears to run after i18n.
        $timeout(truncateNavbar, 0);
        $scope.toggleSidebar = SidebarStatusService.toggleSidebar;
      }
    ]
  };
}]);
