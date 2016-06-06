// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Oppia's base controller.
 */

// TODO(sll): Get this to read from a common JSON file; it's replicated in
// feconf.
oppia.constant('CATEGORY_LIST', GLOBALS.ALL_CATEGORIES || []);

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');

oppia.constant('DEFAULT_RULE_NAME', 'Default');

oppia.constant('FUZZY_RULE_TYPE', 'FuzzyMatches');

oppia.constant('DEFAULT_FUZZY_RULE', {
  rule_type: 'FuzzyMatches',
  inputs: {
    training_data: []
  }
});

oppia.constant('EVENT_HTML_CHANGED', 'htmlChanged');

oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});

oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');

oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// Global utility methods.
oppia.controller('Base', [
  '$scope', '$http', '$rootScope', '$window', '$timeout', '$document', '$log',
  'alertsService', 'LABEL_FOR_CLEARING_FOCUS', 'siteAnalyticsService',
  'windowDimensionsService',
  function(
      $scope, $http, $rootScope, $window, $timeout, $document, $log,
      alertsService, LABEL_FOR_CLEARING_FOCUS, siteAnalyticsService,
      windowDimensionsService) {
    $rootScope.DEV_MODE = GLOBALS.DEV_MODE;

    $scope.alertsService = alertsService;
    $scope.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;

    // If this is nonempty, the whole page goes into 'Loading...' mode.
    $rootScope.loadingMessage = '';

    if (GLOBALS.userIsLoggedIn) {
      // Show the number of unseen notifications in the navbar and page title,
      // unless the user is already on the dashboard page.
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

    // This method is here because the trigger for the tutorial is in the site
    // navbar. It broadcasts an event to tell the exploration editor to open the
    // editor tutorial.
    $scope.openEditorTutorial = function() {
      $scope.$broadcast('openEditorTutorial');
    };

    // The following methods and listeners relate to the global navigation
    // sidebar.
    $scope.openSidebar = function() {
      if (!$scope.sidebarIsShown) {
        $scope.sidebarIsShown = true;
        $scope.pendingSidebarClick = true;
      } else {
        $scope.sidebarIsShown = false;
        $scope.pendingSidebarClick = false;
      }
    };

    // TODO(sll): use 'touchstart' for mobile.
    $document.on('click', function() {
      if (!$scope.pendingSidebarClick) {
        $scope.sidebarIsShown = false;
      } else {
        $scope.pendingSidebarClick = false;
      }
      $scope.$apply();
    });

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

    $scope.onLoginButtonClicked = function(loginUrl) {
      siteAnalyticsService.registerStartLoginEvent('loginButton');
      $timeout(function() {
        $window.location = loginUrl;
      }, 150);
      return false;
    };

    var doesNavbarHaveSearchBar = function() {
      return (
        $window.location.pathname.indexOf('/search') === 0 ||
        $window.location.pathname.indexOf('/library') === 0);
    };

    var navbarCutoffWidthPx = doesNavbarHaveSearchBar() ? 1171 : 800;

    $scope.windowIsNarrow = (
      windowDimensionsService.getWidth() <= navbarCutoffWidthPx);

    windowDimensionsService.registerOnResizeHook(function() {
      $scope.windowIsNarrow = (
        windowDimensionsService.getWidth() <= navbarCutoffWidthPx);
      $scope.$apply();

      // If the window is now wide, and the sidebar is still open, close it.
      if (!$scope.windowIsNarrow) {
        $scope.sidebarIsShown = false;
      }
    });

    $scope.pageHasLoaded = false;
    $scope.pendingSidebarClick = false;
    $scope.sidebarIsShown = false;
    $timeout(function() {
      $scope.pageHasLoaded = true;
    }, 500);
  }
]);
