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
  All = 0,
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4,
  Fatal = 5,
  Off = 6
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  level: LogLevel = LogLevel.All;

  constructor() {}

  private shouldLog(level:LogLevel) {
    return (level >= this.level && level !== LogLevel.Off) || (
      this.level === LogLevel.All);
  }

  debug(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.Debug)) {
      // eslint-disable-next-line no-console
      console.debug(msg, optionalParams);
    }
  }

  info(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.Info)) {
      // eslint-disable-next-line no-console
      console.info(msg, optionalParams);
    }
  }

  warn(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(msg, optionalParams);
    }
  }

  error(msg: string, optionalParams?: any[]) {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(msg, optionalParams);
    }
  }

  log(msg: string, optionalParams?: any[]) {
    // eslint-disable-next-line no-console
    console.log(msg, optionalParams);
  }
}
