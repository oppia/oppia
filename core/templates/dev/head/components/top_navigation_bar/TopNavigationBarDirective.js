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

oppia.directive('topNavigationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/top_navigation_bar/' +
        'top_navigation_bar_directive.html'),
      controller: [
        '$scope', '$http', '$window', '$timeout', '$translate',
        'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS',
        'siteAnalyticsService', 'WindowDimensionsService', 'DebouncerService',
        function(
            $scope, $http, $window, $timeout, $translate,
            SidebarStatusService, LABEL_FOR_CLEARING_FOCUS,
            siteAnalyticsService, WindowDimensionsService, DebouncerService) {
          if (GLOBALS.userIsLoggedIn && GLOBALS.preferredSiteLanguageCode) {
            $translate.use(GLOBALS.preferredSiteLanguageCode);
          }
          var NAV_MODE_SIGNUP = 'signup';
          var NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
            'create', 'explore', 'collection'];
          $scope.NAV_MODE = GLOBALS.NAV_MODE;
          $scope.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
          $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
          $scope.activeMenuName = '';
          $scope.username = GLOBALS.username;
          $scope.profilePictureDataUrl = GLOBALS.profilePictureDataUrl;
          $scope.isAdmin = GLOBALS.isAdmin;
          $scope.isModerator = GLOBALS.isModerator;
          $scope.isSuperAdmin = GLOBALS.isSuperAdmin;
          $scope.logoutUrl = GLOBALS.logoutUrl;
          $scope.ACTION_OPEN = 'open';
          $scope.ACTION_CLOSE = 'close';
          $scope.KEYBOARD_EVENT_TO_KEY_CODES = {
            enter: {
              shiftKeyIsPressed: false,
              keyCode: 13
            },
            tab: {
              shiftKeyIsPressed: false,
              keyCode: 9
            },
            shiftTab: {
              shiftKeyIsPressed: true,
              keyCode: 9
            }
          };
          if ($scope.username) {
            $scope.profilePageUrl = UrlInterpolationService.interpolateUrl(
              '/profile/<username>', {
                username: $scope.username
              });
          }
          $scope.userMenuIsShown = ($scope.NAV_MODE !== NAV_MODE_SIGNUP);
          $scope.standardNavIsShown = (
            NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf($scope.NAV_MODE) === -1);
          if ($scope.NAV_MODE === 'topics_and_skills_dashboard') {
            $scope.standardNavIsShown = false;
          }

          $scope.onLoginButtonClicked = function() {
            siteAnalyticsService.registerStartLoginEvent('loginButton');
            $timeout(function() {
              $window.location = GLOBALS.loginUrl;
            }, 150);
          };
          $scope.onLogoutButtonClicked = function() {
            $window.localStorage.removeItem('last_uploaded_audio_lang');
          };

          /**
           * Opens the submenu.
           * @param {object} evt
           * @param {String} menuName - name of menu, on which
           * open/close action to be performed (aboutMenu,profileMenu).
           */
          $scope.openSubmenu = function(evt, menuName) {
            // Focus on the current target before opening its submenu.
            angular.element(evt.currentTarget).focus();
            $scope.activeMenuName = menuName;
          };
          $scope.blurNavigationLinks = function(evt) {
            // This is required because if about submenu is in open state
            // and when you hover on library, both will be highlighted,
            // To avoid that, blur all the a's in nav, so that only one
            // will be highlighted.
            $('nav a').blur();
          };
          $scope.closeSubmenu = function(evt) {
            $scope.activeMenuName = '';
            angular.element(evt.currentTarget).closest('li')
              .find('a').blur();
          };
          /**
           * Handles keydown events on menus.
           * @param {object} evt
           * @param {String} menuName - name of menu to perform action
           * on(aboutMenu/profileMenu)
           * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
           * corresponding actions to be performed(open/close).
           *
           * @example
           *  onMenuKeypress($event, 'aboutMenu', {enter: 'open'})
           */
          $scope.onMenuKeypress = function(evt, menuName, eventsTobeHandled) {
            var targetEvents = Object.keys(eventsTobeHandled);
            for (var i = 0; i < targetEvents.length; i++) {
              var keyCodeSpec =
                $scope.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
              if (keyCodeSpec.keyCode === evt.keyCode &&
                evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
                if (eventsTobeHandled[targetEvents[i]] === $scope.ACTION_OPEN) {
                  $scope.openSubmenu(evt, menuName);
                } else if (eventsTobeHandled[targetEvents[i]] ===
                  $scope.ACTION_CLOSE) {
                  $scope.closeSubmenu(evt);
                } else {
                  throw Error('Invalid action type.');
                }
              }
            }
          };
          // Close the submenu if focus or click occurs anywhere outside of
          // the menu or outside of its parent (which opens submenu on hover).
          angular.element(document).on('click', function(evt) {
            if (!angular.element(evt.target).closest('li').length) {
              $scope.activeMenuName = '';
              $scope.$apply();
            }
          });

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

          $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
          var currentWindowWidth = WindowDimensionsService.getWidth();
          $scope.navElementsVisibilityStatus = {};
          // The order of the elements in this array specifies the order in
          // which they will be hidden. Earlier elements will be hidden first.
          var NAV_ELEMENTS_ORDER = [
            'I18N_TOPNAV_DONATE', 'I18N_TOPNAV_ABOUT',
            'I18N_CREATE_EXPLORATION_CREATE', 'I18N_TOPNAV_LIBRARY'];
          for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
            $scope.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] = true;
          }

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            $scope.$apply();
            // If window is resized larger, try displaying the hidden elements.
            if (currentWindowWidth < WindowDimensionsService.getWidth()) {
              for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                if (
                  !$scope.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                  $scope.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                    true;
                }
              }
            }

            // Close the sidebar, if necessary.
            SidebarStatusService.closeSidebar();
            $scope.sidebarIsShown = SidebarStatusService.isSidebarShown();
            currentWindowWidth = WindowDimensionsService.getWidth();
            truncateNavbarDebounced();
          });
          $scope.isSidebarShown = function() {
            if (SidebarStatusService.isSidebarShown()) {
              angular.element(document.body).addClass('oppia-stop-scroll');
            } else {
              angular.element(document.body).removeClass('oppia-stop-scroll');
            }
            return SidebarStatusService.isSidebarShown();
          };
          $scope.toggleSidebar = function() {
            SidebarStatusService.toggleSidebar();
          };

          /**
           * Checks if i18n has been run.
           * If i18n has not yet run, the <a> and <span> tags will have
           * no text content, so their innerText.length value will be 0.
           * @returns {boolean}
           */
          var checkIfI18NCompleted = function() {
            var i18nCompleted = true;
            var tabs = document.querySelectorAll('.oppia-navbar-tab-content');
            for (var i = 0; i < tabs.length; i++) {
              if (tabs[i].innerText.length === 0) {
                i18nCompleted = false;
                break;
              }
            }
            return i18nCompleted;
          };

          /**
           * Checks if window is >768px and i18n is completed, then checks
           * for overflow. If overflow is detected, hides the least important
           * tab and then calls itself again after a 50ms delay.
           */
          var truncateNavbar = function() {
            // If the window is narrow, the standard nav tabs are not shown.
            if (WindowDimensionsService.isWindowNarrow()) {
              return;
            }

            // If i18n hasn't completed, retry after 100ms.
            if (!checkIfI18NCompleted()) {
              $timeout(truncateNavbar, 100);
              return;
            }

            // The value of 60px used here comes from measuring the normal
            // height of the navbar (56px) in Chrome's inspector and rounding
            // up. If the height of the navbar is changed in the future this
            // will need to be updated.
            if (document.querySelector('div.collapse.navbar-collapse')
              .clientHeight > 60) {
              for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                if (
                  $scope.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                  // Hide one element, then check again after 50ms.
                  // This gives the browser time to render the visibility
                  // change.
                  $scope.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                    false;
                  // Force a digest cycle to hide element immediately.
                  // Otherwise it would be hidden after the next call.
                  // This is due to setTimeout use in debounce.
                  $scope.$apply();
                  $timeout(truncateNavbar, 50);
                  return;
                }
              }
            }
          };

          var truncateNavbarDebounced =
            DebouncerService.debounce(truncateNavbar, 500);

          // The function needs to be run after i18n. A timeout of 0 appears to
          // run after i18n in Chrome, but not other browsers. The function will
          // check if i18n is complete and set a new timeout if it is not. Since
          // a timeout of 0 works for at least one browser, it is used here.
          $timeout(truncateNavbar, 0);
          $scope.$on('searchBarLoaded', function() {
            $timeout(truncateNavbar, 100);
          });
        }
      ]
    };
  }]);
