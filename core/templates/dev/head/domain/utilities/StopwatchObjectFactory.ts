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
 * @fileoverview Object factory for creating stopwatches.
 */

// A simple service that provides stopwatch instances. Each stopwatch can be
// independently reset and queried for the current time.

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { LoggerService } from 'services/contextual/logger.service';

export class Stopwatch {
  startTime;
  constructor(private log:LoggerService) {
    this.startTime = null;
  }

  _getCurrentTime(): number {
    return Date.now();
  }

  reset(): void {
    this.startTime = this._getCurrentTime();
  }

  getTimeInSecs(): number | null {
    if (this.startTime === null) {
      this.log.error(
        'Tried to retrieve the elapsed time, but no start time was set.');
      return null;
    }
    return (this._getCurrentTime() - this.startTime) / 1000;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StopwatchObjectFactory {
  create(): Stopwatch {
    return new Stopwatch(new LoggerService());
  }
}

angular.module('oppia').factory(
  'StopwatchObjectFactory',
  downgradeInjectable(StopwatchObjectFactory));
