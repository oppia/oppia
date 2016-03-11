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
 * @fileoverview Factory for handling warnings and info messages.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('alertsService', ['$log', function($log) {
  var alertsService = {
    warnings: [],
    messages: []
  };
  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 100;
  var MAX_TOTAL_MESSAGES = 100;
  var warningsSoFar = 0;
  var messagesSoFar = 0;

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
   * Adds a message, could be info messages or success messages.
   * @param {string} type - Type of message
   * @param {string} message - Message content
   */
  alertsService.addMessage = function(type, message) {
    messagesSoFar++;
    if (messagesSoFar > MAX_TOTAL_MESSAGES) {
      return;
    }
    alertsService.messages.push({
      type: type,
      content: message
    });
  };

  /**
   * Deletes the message from the messages list.
   * @param {Object} message - Message to be deleted.
   */
  alertsService.deleteMessage = function(message) {
    var messages = alertsService.messages;
    var newMessages = [];
    for (var i = 0; i < messages.length; i++) {
      if (messages[i] != message) {
        newMessages.push(messages[i]);
      }
    }
    alertsService.messages = newMessages;
  };

  /**
   * Adds an info message.
   * @param {string} message - Info message to display.
   */
  alertsService.addInfoMessage = function(message) {
    alertsService.addMessage('info', message);
  };

  /**
   * Adds a success message.
   * @param {string} message - Success message to display
   */
  alertsService.addSuccessMessage = function(message) {
    alertsService.addMessage('success', message);
  };

  /**
   * Clears all messages.
   */
  alertsService.clearMessages = function() {
    alertsService.messages = [];
  };

  return alertsService;
}]);

oppia.directive('alertMessage', [function() {
  return {
    restrict: 'E',
    scope: {
      getMessage: '&messageObject',
      getMessageIndex: '&messageIndex'
    },
    template: '<div class="oppia-alert-message"></div>',
    controller: [
      '$scope', 'alertsService', 'toastr',
      function($scope, alertsService, toastr) {
        $scope.alertsService = alertsService;
        $scope.toastr = toastr;
      }
    ],
    link: function(scope) {
      var message = scope.getMessage();
      if (message.type == 'info') {
        scope.toastr.info(message.content, {
          onHidden: function() {
            scope.alertsService.deleteMessage(message);
          }
        });
      } else if (message.type == 'success') {
        scope.toastr.success(message.content, {
          onHidden: function() {
            scope.alertsService.deleteMessage(message);
          }
        });
      }
    }
  };
}]);
