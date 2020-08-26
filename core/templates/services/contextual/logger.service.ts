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
 * @fileoverview Service for logging.
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  constructor() {}

  /**
   * Logs a message to console at the debug level.
   * @param msg - A message to log.
   */
  debug(msg: string): void {
    // eslint-disable-next-line no-console
    console.debug(msg);
  }

  /**
   * Logs a message to console at the info level.
   * @param msg - A message to log.
   */
  info(msg: string): void {
    // eslint-disable-next-line no-console
    console.info(msg);
  }

  /**
   * Logs a message to console at the warning level.
   * @param msg - A message to log.
   */
  warn(msg: string): void {
    console.warn(msg);
  }

  /**
   * Logs a message to console at the error level.
   * @param msg - A message to log.
   */
  error(msg: string): void {
    console.error(msg);
  }

  /**
   * Logs a message to console.
   * @param msg - A message to log.
   */
  log(msg: string): void {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
}
