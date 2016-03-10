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
 * @fileoverview Factory for handling warnings and info messages.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('alertsService', ['$log', function($log) {
  var alertsService = {
    warnings: [],
    infoMessages: []
  };
  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 100;
  var MAX_TOTAL_INFO_MESSAGES = 100;
  var warningsSoFar = 0;
  var infoMessagesSoFar = 0;

  /**
   * Adds a warning message.
   * @param {string} warning - The warning message to display.
   */
  alertsService.addWarning = function(warning) {
    $log.error(warning);
    warningsSoFar++;
    if (warningsSoFar > MAX_TOTAL_WARNINGS) {
      return;
    }
    alertsService.warnings.push(warning);
  };

  /**
   * Adds a warning in the same way as addWarning(), except it also throws an
   * exception to cause a hard failure in the frontend.
   * @param {string} warning - The warning message to display.
   */
  alertsService.fatalWarning = function(warning) {
    alertsService.addWarning(warning);
    throw new Error(warning);
  };

  /**
   * Deletes the warning from the warnings list.
   * @param {string} warning - The warning message to be deleted.
   */
  alertsService.deleteWarning = function(warning) {
    var warnings = alertsService.warnings;
    var newWarnings = [];
    for (var i = 0; i < warnings.length; i++) {
      if (warnings[i] != warning) {
        newWarnings.push(warnings[i]);
      }
    }
    alertsService.warnings = newWarnings;
  };

  /**
   * Clears all warnings.
   */
  alertsService.clearWarnings = function() {
    alertsService.warnings = [];
  };

  /**
   * Adds an info message(FYI-type messages)
   * @param {string} message - The info message to display.
   */
  alertsService.addInfoMessage = function(message) {
    infoMessagesSoFar++;
    if (infoMessagesSoFar > MAX_TOTAL_INFO_MESSAGES) {
      return;
    }
    alertsService.infoMessages.push(message);
  };

  /**
   * Deletes the message from the info messages list
   * @param {string} message - Message to be deleted.
   */
  alertsService.deleteInfoMessage = function(message) {
    var infoMessages = alertsService.infoMessages;
    var newInfoMessages = [];
    for (var i = 0; i < infoMessages.length; i++) {
      if (infoMessages[i] != message) {
        newInfoMessages.push(infoMessages[i]);
      }
    }
    alertsService.infoMessages = newInfoMessages;
  };

  /**
   * Clears all info messages.
   */
  alertsService.clearInfoMessages = function() {
    alertsService.infoMessages = [];
  };

  return alertsService;
}]);

oppia.directive('infoMessage', [function() {
  return {
    restrict: 'E',
    scope: {
      getMessage: '&messageContent',
      getMessageIndex: '&messageIndex'
    },
    template: '<div class="oppia-info-message"></div>',
    controller: [
      '$scope', 'alertsService', 'toastr',
      function($scope, alertsService, toastr) {
        $scope.alertsService = alertsService;
        $scope.toastr = toastr;
      }
    ],
    link: function(scope) {
      var message = scope.getMessage();
      scope.toastr.success(message, {
        onHidden: function() {
          scope.alertsService.deleteInfoMessage(message);
        }
      });
    }
  };
}]);
