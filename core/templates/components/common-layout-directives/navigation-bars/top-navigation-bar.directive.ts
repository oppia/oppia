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

require('domain/sidebar/sidebar-status.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/debouncer.service.ts');
require('services/navigation.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');
require('services/contextual/device-info.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('topNavigationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./top-navigation-bar.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$http', '$window', '$timeout', '$translate',
        'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS', 'UserService',
        'SiteAnalyticsService', 'NavigationService', 'WindowDimensionsService',
        'DebouncerService', 'DeviceInfoService', 'LOGOUT_URL',
        function(
            $scope, $http, $window, $timeout, $translate,
            SidebarStatusService, LABEL_FOR_CLEARING_FOCUS, UserService,
            SiteAnalyticsService, NavigationService, WindowDimensionsService,
            DebouncerService, DeviceInfoService, LOGOUT_URL) {
          var ctrl = this;
          var NAV_MODE_SIGNUP = 'signup';
          var NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
            'create', 'explore', 'collection', 'collection_editor',
            'topics_and_skills_dashboard', 'topic_editor', 'skill_editor',
            'story_editor'];
          var currentWindowWidth = WindowDimensionsService.getWidth();
          // The order of the elements in this array specifies the order in
          // which they will be hidden. Earlier elements will be hidden first.
          var NAV_ELEMENTS_ORDER = [
            'I18N_TOPNAV_DONATE', 'I18N_TOPNAV_ABOUT',
            'I18N_CREATE_EXPLORATION_CREATE', 'I18N_TOPNAV_LIBRARY'];
          var truncateNavbarDebounced =
            DebouncerService.debounce(truncateNavbar, 500);

          ctrl.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
          ctrl.onLoginButtonClicked = function() {
            SiteAnalyticsService.registerStartLoginEvent('loginButton');
            UserService.getLoginUrlAsync().then(
              function(loginUrl) {
                if (loginUrl) {
                  $timeout(function() {
                    $window.location = loginUrl;
                  }, 150);
                } else {
                  throw Error('Login url not found.');
                }
              }
            );
          };
          ctrl.onLogoutButtonClicked = function() {
            $window.localStorage.removeItem('last_uploaded_audio_lang');
          };
          /**
           * Opens the submenu.
           * @param {object} evt
           * @param {String} menuName - name of menu, on which
           * open/close action to be performed (aboutMenu,profileMenu).
           */
          ctrl.openSubmenu = function(evt, menuName) {
            // Focus on the current target before opening its submenu.
            NavigationService.openSubmenu(evt, menuName);
          };
          ctrl.blurNavigationLinks = function(evt) {
            // This is required because if about submenu is in open state
            // and when you hover on library, both will be highlighted,
            // To avoid that, blur all the a's in nav, so that only one
            // will be highlighted.
            $('nav a').blur();
          };
          ctrl.closeSubmenu = function(evt) {
            NavigationService.closeSubmenu(evt);
          };
          ctrl.closeSubmenuIfNotMobile = function(evt) {
            if (DeviceInfoService.isMobileDevice()) {
              return;
            }
            ctrl.closeSubmenu(evt);
          };
          /**
           * Handles keydown events on menus.
           * @param {object} evt
           * @param {String} menuName - name of menu to perform action
           * on(aboutMenu/profileMenu)
           * @param {object} eventsTobeHandled - Map keyboard events('Enter')
           * to corresponding actions to be performed(open/close).
           *
           * @example
           *  onMenuKeypress($event, 'aboutMenu', {enter: 'open'})
           */
          ctrl.onMenuKeypress = function(evt, menuName, eventsTobeHandled) {
            NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
            ctrl.activeMenuName = NavigationService.activeMenuName;
          };

          ctrl.isSidebarShown = function() {
            if (SidebarStatusService.isSidebarShown()) {
              angular.element(document.body).addClass('oppia-stop-scroll');
            } else {
              angular.element(document.body).removeClass('oppia-stop-scroll');
            }
            return SidebarStatusService.isSidebarShown();
          };
          ctrl.toggleSidebar = function() {
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
              if ((<HTMLElement>tabs[i]).innerText.length === 0) {
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
                  ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                  // Hide one element, then check again after 50ms.
                  // This gives the browser time to render the visibility
                  // change.
                  ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                    false;
                  // Force a digest cycle to hide element immediately.
                  // Otherwise it would be hidden after the next call.
                  // This is due to $timeout use in debounce.
                  $scope.$applyAsync();
                  $timeout(truncateNavbar, 50);
                  return;
                }
              }
            }
          };

          ctrl.$onInit = function() {
            ctrl.isModerator = null;
            ctrl.isAdmin = null;
            ctrl.isTopicManager = null;
            ctrl.isSuperAdmin = null;
            ctrl.userIsLoggedIn = null;
            ctrl.username = '';
            ctrl.currentUrl = window.location.pathname.split('/')[1];
            ctrl.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
            ctrl.logoutUrl = LOGOUT_URL;
            ctrl.userMenuIsShown = (ctrl.currentUrl !== NAV_MODE_SIGNUP);
            ctrl.standardNavIsShown = (
              NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf(ctrl.currentUrl) === -1);
            ctrl.googleSignInIconUrl = (
              UrlInterpolationService.getStaticImageUrl(
                '/google_signin_buttons/google_signin.svg'));
            ctrl.ACTION_OPEN = NavigationService.ACTION_OPEN;
            ctrl.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
            ctrl.KEYBOARD_EVENT_TO_KEY_CODES =
            NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
            ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            ctrl.navElementsVisibilityStatus = {};

            // Close the submenu if focus or click occurs anywhere outside of
            // the menu or outside of its parent (which opens submenu on hover).
            angular.element(document).on('click', function(evt) {
              if (!angular.element(evt.target).closest('li').length) {
                ctrl.activeMenuName = '';
                $scope.$applyAsync();
              }
            });

            $scope.$on('searchBarLoaded', function() {
              $timeout(truncateNavbar, 100);
            });

            UserService.getUserInfoAsync().then(function(userInfo) {
              if (userInfo.getPreferredSiteLanguageCode()) {
                $translate.use(userInfo.getPreferredSiteLanguageCode());
              }
              ctrl.isModerator = userInfo.isModerator();
              ctrl.isAdmin = userInfo.isAdmin();
              ctrl.isTopicManager = userInfo.isTopicManager();
              ctrl.isSuperAdmin = userInfo.isSuperAdmin();
              ctrl.userIsLoggedIn = userInfo.isLoggedIn();
              ctrl.username = userInfo.getUsername();
              if (ctrl.username) {
                ctrl.profilePageUrl = UrlInterpolationService.interpolateUrl(
                  '/profile/<username>', {
                    username: ctrl.username
                  });
              }

              if (ctrl.userIsLoggedIn) {
                // Show the number of unseen notifications in the navbar and
                // page title, unless the user is already on the dashboard page.
                $http.get('/notificationshandler').then(function(response) {
                  var data = response.data;
                  if ($window.location.pathname !== '/') {
                    ctrl.numUnseenNotifications = data.num_unseen_notifications;
                    if (ctrl.numUnseenNotifications > 0) {
                      $window.document.title = (
                        '(' + ctrl.numUnseenNotifications + ') ' +
                        $window.document.title);
                    }
                  }
                });
              }
            });
            UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
              ctrl.profilePictureDataUrl = dataUrl;
            });

            for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
              ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] = true;
            }

            WindowDimensionsService.registerOnResizeHook(function() {
              ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
              $scope.$applyAsync();
              // If window is resized larger, try displaying the hidden
              // elements.
              if (
                currentWindowWidth < WindowDimensionsService.getWidth()) {
                for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                  if (
                    !ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                    ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                      true;
                  }
                }
              }

              // Close the sidebar, if necessary.
              SidebarStatusService.closeSidebar();
              ctrl.sidebarIsShown = SidebarStatusService.isSidebarShown();
              currentWindowWidth = WindowDimensionsService.getWidth();
              truncateNavbarDebounced();
            });
            // The function needs to be run after i18n. A timeout of 0 appears
            // to run after i18n in Chrome, but not other browsers. The function
            // will check if i18n is complete and set a new timeout if it is
            // not. Since a timeout of 0 works for at least one browser,
            // it is used here.
            $timeout(truncateNavbar, 0);
          };
        }
      ]
    };
  }]);
