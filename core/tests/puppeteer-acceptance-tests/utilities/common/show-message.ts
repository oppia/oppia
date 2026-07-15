// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility function for logging the progress of the tests.
 */

type MessageType = 'log' | 'browser';

/**
 * Function to log the progress of the tests.
 * @param {string} message - The message to log.
 * @param {MessageType} messageType - The type of message to log.
 */
export let showMessage = function (
  message: string,
  messageType: MessageType = 'log'
): void {
  const messagePrefixes = {
    log: '[test-log]',
    browser: '[browser-log]',
  };
  // We use console statements to log the progress or feedback of the tests.
  // eslint-disable-next-line no-console
  console.log(`${messagePrefixes[messageType]}: ` + message);
};
