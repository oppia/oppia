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
    /**
     * List of warning messages.
     */
    warnings: [],
    /**
     * List of "success" or "info" messages.
     */
    messages: []
  };

  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 10;
  var MAX_TOTAL_MESSAGES = 10;
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
    alertsService.warnings.push({
      type: 'warning',
      content: warning
    });
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
   * @param {Object} warningObject - The warning message to be deleted.
   */
  alertsService.deleteWarning = function(warningObject) {
    var warnings = alertsService.warnings;
    var newWarnings = [];
    var warningsCount = 0;
    for (var i = 0; i < warnings.length; i++) {
      if (warnings[i].content != warningObject.content) {
        warningsCount++;
        newWarnings.push(warnings[i]);
      }
    }
    warningsSoFar = warningsCount;
    alertsService.warnings = newWarnings;
  };

  /**
   * Clears all warnings.
   */
  alertsService.clearWarnings = function() {
    alertsService.warnings = [];
    warningsSoFar = 0;
  };

  /**
   * Adds a message, can be info messages or success messages.
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
   * @param {Object} messageObject - Message to be deleted.
   */
  alertsService.deleteMessage = function(messageObject) {
    var messages = alertsService.messages;
    var newMessages = [];
    var messagesCount = 0;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].type != messageObject.type ||
          messages[i].content != messageObject.content) {
        messagesCount++;
        newMessages.push(messages[i]);
      }
    }
    messagesSoFar = messagesCount;
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
    messagesSoFar = 0;
  };

  return alertsService;
}]);
