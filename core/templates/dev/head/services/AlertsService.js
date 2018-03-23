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
 */

oppia.factory('AlertsService', ['$log', function($log) {
  var AlertsService = {
    /**
     * Each element in each of the arrays here is an object with two keys:
     *   - type:  a string specifying the type of message or warning.
     *            Possible types - "warning", "info" or "success".
     *   - content: a string containing the warning or message.
     */

    /**
     * Array of "warning" messages.
     */
    warnings: [],
    /**
     * Array of "success" or "info" messages.
     */
    messages: []
  };

  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 10;
  var MAX_TOTAL_MESSAGES = 10;

  /**
   * Adds a warning message.
   * @param {string} warning - The warning message to display.
   */
  AlertsService.addWarning = function(warning) {
    $log.error(warning);
    if (AlertsService.warnings.length >= MAX_TOTAL_WARNINGS) {
      return;
    }
    AlertsService.warnings.push({
      type: 'warning',
      content: warning
    });
  };

  /**
   * Adds a warning in the same way as addWarning(), except it also throws an
   * exception to cause a hard failure in the frontend.
   * @param {string} warning - The warning message to display.
   */
  AlertsService.fatalWarning = function(warning) {
    AlertsService.addWarning(warning);
    throw new Error(warning);
  };

  /**
   * Deletes the warning from the warnings list.
   * @param {Object} warningObject - The warning message to be deleted.
   */
  AlertsService.deleteWarning = function(warningObject) {
    var warnings = AlertsService.warnings;
    var newWarnings = [];
    for (var i = 0; i < warnings.length; i++) {
      if (warnings[i].content !== warningObject.content) {
        newWarnings.push(warnings[i]);
      }
    }
    AlertsService.warnings = newWarnings;
  };

  /**
   * Clears all warnings.
   */
  AlertsService.clearWarnings = function() {
    AlertsService.warnings = [];
  };

  /**
     * Adds a message, can be info messages or success messages.
     * @param {string} type - Type of message
     * @param {string} message - Message content
     * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
     */
  AlertsService.addMessage = function(type, message, timeoutMilliseconds) {
    if (AlertsService.messages.length >= MAX_TOTAL_MESSAGES) {
      return;
    }
    AlertsService.messages.push({
      type: type,
      content: message,
      timeout: timeoutMilliseconds
    });
  };

  /**
   * Deletes the message from the messages list.
   * @param {Object} messageObject - Message to be deleted.
   */
  AlertsService.deleteMessage = function(messageObject) {
    var messages = AlertsService.messages;
    var newMessages = [];
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].type !== messageObject.type ||
          messages[i].content !== messageObject.content) {
        newMessages.push(messages[i]);
      }
    }
    AlertsService.messages = newMessages;
  };

  /**
     * Adds an info message.
     * @param {string} message - Info message to display.
     * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
     */
  AlertsService.addInfoMessage = function(message, timeoutMilliseconds) {
    if (timeoutMilliseconds === undefined) {
      timeoutMilliseconds = 1500;
    }
    AlertsService.addMessage('info', message, timeoutMilliseconds);
  };

  /**
     * Adds a success message.
     * @param {string} message - Success message to display
     * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
     */
  AlertsService.addSuccessMessage = function(message, timeoutMilliseconds) {
    if (timeoutMilliseconds === undefined) {
      timeoutMilliseconds = 1500;
    }
    AlertsService.addMessage('success', message, timeoutMilliseconds);
  };

  /**
   * Clears all messages.
   */
  AlertsService.clearMessages = function() {
    AlertsService.messages = [];
  };

  return AlertsService;
}]);
