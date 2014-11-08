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


// Global utility methods.
oppia.controller('Base', [
    '$scope', '$http', '$rootScope', '$window', '$log',
    'warningsData', 'activeInputData', 'messengerService',
    function($scope, $http, $rootScope, $window, $log,
             warningsData, activeInputData, messengerService) {
  $rootScope.DEV_MODE = GLOBALS.DEV_MODE;

  $scope.warningsData = warningsData;
  $scope.activeInputData = activeInputData;

  // If this is nonempty, the whole page goes into 'Loading...' mode.
  $rootScope.loadingMessage = '';

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

  $scope.cloneObject = function(obj) {
    return angular.copy(obj);
  };
}]);
