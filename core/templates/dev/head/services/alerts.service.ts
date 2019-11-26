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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { LoggerService } from 'services/contextual/logger.service';

export interface Warning {
  type: string;
  content: string;
}

export interface Message {
    type:string;
    content:string;
    timeout:number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  /**
   * Each element in each of the arrays here is an object with two keys:
   *   - type:  a string specifying the type of message or warning.
   *            Possible types - "warning", "info" or "success".
   *   - content: a string containing the warning or message.
   */

  /**
   * Array of "warning" messages.
   */
  warnings: Warning[] = new Array<Warning>();
  /**
   * Array of "success" or "info" messages.
   */
  messages: Message[] = new Array<Message>();

  // This is to prevent infinite loops.
  MAX_TOTAL_WARNINGS: number = 10;
  MAX_TOTAL_MESSAGES: number = 10;

  constructor(private log: LoggerService) {}

  /**
   * Adds a warning message.
   * @param {string} warning - The warning message to display.
   */
  addWarning(warning: string): void {
    this.log.error(warning);
    if (this.warnings.length >= this.MAX_TOTAL_WARNINGS) {
      return;
    }
    this.warnings.push({
      type: 'warning',
      content: warning
    });
  }

  /**
   * Adds a warning in the same way as addWarning(), except it also throws an
   * exception to cause a hard failure in the frontend.
   * @param {string} warning - The warning message to display.
   */
  fatalWarning(warning: string): void {
    this.addWarning(warning);
    throw new Error(warning);
  }

  /**
   * Deletes the warning from the warnings list.
   * @param {Object} warningObject - The warning message to be deleted.
   */
  deleteWarning(warningObject: Warning): void {
    var warnings = this.warnings;
    var newWarnings = [];
    for (var i = 0; i < warnings.length; i++) {
      if (warnings[i].content !== warningObject.content) {
        newWarnings.push(warnings[i]);
      }
    }
    this.warnings = newWarnings;
  }

  /**
   * Clears all warnings.
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Adds a message, can be info messages or success messages.
   * @param {string} type - Type of message
   * @param {string} message - Message content
   * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
   */
  addMessage(type: string, message: string, timeoutMilliseconds: number): void {
    if (this.messages.length >= this.MAX_TOTAL_MESSAGES) {
      return;
    }
    this.messages.push({
      type: type,
      content: message,
      timeout: timeoutMilliseconds
    });
  }

  /**
   * Deletes the message from the messages list.
   * @param {Object} messageObject - Message to be deleted.
   */
  deleteMessage(messageObject: Message): void {
    var messages = this.messages;
    var newMessages = [];
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].type !== messageObject.type ||
          messages[i].content !== messageObject.content) {
        newMessages.push(messages[i]);
      }
    }
    this.messages = newMessages;
  }

  /**
   * Adds an info message.
   * @param {string} message - Info message to display.
   * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
   */
  addInfoMessage(message: string, timeoutMilliseconds: number): void {
    if (timeoutMilliseconds === undefined) {
      timeoutMilliseconds = 1500;
    }
    this.addMessage('info', message, timeoutMilliseconds);
  }

  /**
   * Adds a success message.
   * @param {string} message - Success message to display
   * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
   */
  addSuccessMessage(message: string, timeoutMilliseconds: number): void {
    if (timeoutMilliseconds === undefined) {
      timeoutMilliseconds = 1500;
    }
    this.addMessage('success', message, timeoutMilliseconds);
  }

  /**
   * Clears all messages.
   */
  clearMessages(): void {
    this.messages = [];
  }
}

angular.module('oppia').factory(
  'AlertsService', downgradeInjectable(AlertsService));
