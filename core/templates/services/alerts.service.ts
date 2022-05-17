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
    type: string;
    content: string;
    timeout: number;
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

  // TODO(#8472): Remove static when migration is complete.
  // Until then, we need to use static so that the two instances of the service
  // created by our hybrid app (one for Angular, the other for AngularJS) can
  // refer to the same objects.
  private static warnings: Warning[] = [];
  get warnings(): Warning[] {
    return AlertsService.warnings;
  }

  private static messages: Message[] = [];
  get messages(): Message[] {
    return AlertsService.messages;
  }

  // This is to prevent infinite loops.
  MAX_TOTAL_WARNINGS: number = 10;
  MAX_TOTAL_MESSAGES: number = 10;

  constructor(private log: LoggerService) {
    // Since warnings and messages are static, clearing them in the constructor
    // retain "instance-like" behavior.
    this.clearWarnings();
    this.clearMessages();
  }

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
   * @param {Object} warningToDelete - The warning message to be deleted.
   */
  deleteWarning(warningToDelete: Warning): void {
    const filteredWarnings = (
      this.warnings.filter(w => w.content !== warningToDelete.content));
    this.warnings.splice(0, this.warnings.length, ...filteredWarnings);
  }

  /**
   * Clears all warnings.
   */
  clearWarnings(): void {
    this.warnings.splice(0, this.warnings.length);
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
   * @param {Object} messageToDelete - Message to be deleted.
   */
  deleteMessage(messageToDelete: Message): void {
    const isMessageToKeep = (m: Message) => (
      m.type !== messageToDelete.type || m.content !== messageToDelete.content);
    const filteredMessages = this.messages.filter(isMessageToKeep);
    this.messages.splice(0, this.messages.length, ...filteredMessages);
  }

  /**
   * Adds an info message.
   * @param {string} message - Info message to display.
   * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
   */
  addInfoMessage(message: string, timeoutMilliseconds?: number): void {
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
  addSuccessMessage(message: string, timeoutMilliseconds?: number): void {
    if (timeoutMilliseconds === undefined) {
      timeoutMilliseconds = 1500;
    }
    this.addMessage('success', message, timeoutMilliseconds);
  }

  /**
   * Clears all messages.
   */
  clearMessages(): void {
    this.messages.splice(0, this.messages.length);
  }
}

angular.module('oppia').factory(
  'AlertsService', downgradeInjectable(AlertsService));
