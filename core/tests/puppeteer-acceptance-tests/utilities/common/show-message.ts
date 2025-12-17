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
 * Returns current timestamp in MM:SS.mmm format for log messages.
 */
const getTimestamp = function (): string {
  const now = new Date();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const millis = now.getMilliseconds().toString().padStart(3, '0');
  return `${minutes}:${seconds}.${millis}`;
};

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
  // Write directly to stdout to avoid Jest's console interception which adds
  // noisy stack traces to every log message.
  process.stdout.write(
    `${messagePrefixes[messageType]} ${getTimestamp()}: ${message}\n`
  );
};
