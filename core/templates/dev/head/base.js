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
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.constant('CATEGORY_LIST', [
  'Architecture',
  'Art',
  'Biology',
  'Business',
  'Chemistry',
  'Computing',
  'Economics',
  'Education',
  'Engineering',
  'Environment',
  'Geography',
  'Government',
  'Hobbies',
  'Languages',
  'Law',
  'Life Skills',
  'Mathematics',
  'Medicine',
  'Music',
  'Philosophy',
  'Physics',
  'Programming',
  'Psychology',
  'Puzzles',
  'Reading',
  'Religion',
  'Sport',
  'Statistics',
  'Welcome'
]);

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');

oppia.constant('DEFAULT_RULE_NAME', 'Default');

oppia.constant('FUZZY_RULE_TYPE', 'FuzzyMatches');

oppia.constant('DEFAULT_FUZZY_RULE', {
  'rule_type': 'FuzzyMatches',
  'inputs': {
    'training_data': []
  }
})

oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');

// Global utility methods.
oppia.controller('Base', [
    '$scope', '$http', '$rootScope', '$window', '$timeout', '$document', '$log',
    'warningsData', 'activeInputData', 'messengerService',
    function($scope, $http, $rootScope, $window, $timeout, $document, $log,
             warningsData, activeInputData, messengerService) {
  $rootScope.DEV_MODE = GLOBALS.DEV_MODE;

  $scope.warningsData = warningsData;
  $scope.activeInputData = activeInputData;

  // If this is nonempty, the whole page goes into 'Loading...' mode.
  $rootScope.loadingMessage = '';

  if (GLOBALS.userIsLoggedIn) {
    // Show the number of unseen notifications in the navbar and page title,
    // unless the user is already on the dashboard page.
    $http.get('/notificationshandler').success(function(data) {
      if ($window.location.pathname !== '/') {
        $scope.numUnseenNotifications = data.num_unseen_notifications;
        if ($scope.numUnseenNotifications > 0) {
          $window.document.title = (
            '(' + $scope.numUnseenNotifications + ') ' + $window.document.title);
        }
      }
    });
  }

  /**
   * Checks if an object is empty.
   */
  $scope.isEmpty = function(obj) {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Adds content to an iframe.
   * @param {Element} iframe The iframe element to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframe = function(iframe, content) {
    if (typeof(iframe) == 'string') {
      iframe = document.getElementById(iframe);
    }
    if (!iframe) {
      $log.error('Could not add content to iframe: no iframe found.');
      return;
    }
    if (iframe.contentDocument) {
      doc = iframe.contentDocument;
    } else {
      doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.document;
    }
    doc.open();
    doc.writeln(content);
    doc.close();
  };

  /**
   * Adds content to an iframe where iframe is specified by its ID.
   * @param {string} iframeId The id of the iframe to add content to.
   * @param {string} content The code for the iframe.
   */
  $scope.addContentToIframeWithId = function(iframeId, content) {
    $scope.addContentToIframe(document.getElementById(iframeId), content);
  };

  // This method is here because the trigger for the tutorial is in the site
  // navbar. It broadcasts an event to tell the exploration editor to open the
  // editor tutorial.
  $scope.openEditorTutorial = function() {
    $scope.$broadcast('openEditorTutorial');
  };

  // The following methods and listeners relate to the global navigation sidebar.
  $scope.openSidebar = function() {
    if (!$scope.sidebarIsShown) {
      $scope.sidebarIsShown = true;
      $scope.pendingSidebarClick = true;
    }
  };

  // TODO(sll): use 'touchstart' for mobile.
  $document.on('click', function(evt) {
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

  $scope.pageHasLoaded = false;
  $scope.pendingSidebarClick = false;
  $scope.sidebarIsShown = false;
  $timeout(function() {
    $scope.pageHasLoaded = true;
  }, 500);
}]);
