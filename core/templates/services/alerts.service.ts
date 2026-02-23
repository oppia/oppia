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

import {Injectable} from '@angular/core';

import {LoggerService} from 'services/contextual/logger.service';

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
  providedIn: 'root',
})
export class AlertsService {
  /**
   * Each element in each of the arrays here is an object with two keys:
   *   - type:  a string specifying the type of message or warning.
   *            Possible types - "warning", "info" or "success".
   *   - content: a string containing the warning or message.
   */

  private _warnings: Warning[] = [];
  private _messages: Message[] = [];

  get warnings(): Warning[] {
    return this._warnings;
  }

  get messages(): Message[] {
    return this._messages;
  }
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
    if (this._warnings.length >= this.MAX_TOTAL_WARNINGS) {
      return;
    }
    this._warnings.push({
      type: 'warning',
      content: warning,
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
    const filteredWarnings = this._warnings.filter(
      w => w.content !== warningToDelete.content
    );
    this._warnings.splice(0, this._warnings.length, ...filteredWarnings);
  }

  /**
   * Clears all warnings.
   */
  clearWarnings(): void {
    this._warnings.splice(0, this._warnings.length);
  }

  /**
   * Adds a message, can be info messages or success messages.
   * @param {string} type - Type of message
   * @param {string} message - Message content
   * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
   */
  addMessage(type: string, message: string, timeoutMilliseconds: number): void {
    if (this._messages.length >= this.MAX_TOTAL_MESSAGES) {
      return;
    }
    this._messages.push({
      type: type,
      content: message,
      timeout: timeoutMilliseconds,
    });
  }
  /**
   * Deletes the message from the messages list.
   * @param {Object} messageToDelete - Message to be deleted.
   */
  deleteMessage(messageToDelete: Message): void {
    const isMessageToKeep = (m: Message): boolean =>
      m.type !== messageToDelete.type || m.content !== messageToDelete.content;
    const filteredMessages = this._messages.filter(isMessageToKeep);
    this._messages.splice(0, this._messages.length, ...filteredMessages);
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
      timeoutMilliseconds = 3000;
    }
    this.addMessage('success', message, timeoutMilliseconds);
  }

  /**
   * Clears all messages.
   */
  clearMessages(): void {
    this._messages.splice(0, this._messages.length);
  }
}
