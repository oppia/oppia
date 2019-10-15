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
import { downgradeInjectable } from '@angular/upgrade/static';

export enum LogLevel {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  level: LogLevel = LogLevel.ALL;

  constructor() {}
  // Flag to check if we can log the message in console. It will always log
  // level is set to ALL. We can turn it off by replacing level with
  // LogLevel.OFF.
  private shouldLog(level:LogLevel) {
    return (level >= this.level && level !== LogLevel.OFF) || (
      this.level === LogLevel.ALL);
  }

  debug(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.debug(msg, optionalParams);
    }
  }

  info(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.info(msg, optionalParams);
    }
  }

  warn(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(msg, optionalParams);
    }
  }

  error(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(msg, optionalParams);
    }
  }

  log(msg: string, optionalParams?: any[]) {
    // eslint-disable-next-line no-console
    console.log(msg, optionalParams);
  }
}
