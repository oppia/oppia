// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a record of the users progression
 * in the diagnostic test session.
 */


import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticTestPlayerStatusService {
  private _diagnosticTestPlayerCompletedEventEmitter = (
    new EventEmitter<string[]>());

  private _diagnosticTestPlayerProgressChangeEventEmitter = (
    new EventEmitter<number>());

  private _diagnosticTestSkipQuestionEventEmitter = (
    new EventEmitter<void>());

  get onDiagnosticTestSessionCompleted(): EventEmitter<string[]> {
    return this._diagnosticTestPlayerCompletedEventEmitter;
  }

  get onDiagnosticTestSessionProgressChange(): EventEmitter<number> {
    return this._diagnosticTestPlayerProgressChangeEventEmitter;
  }

  get onDiagnosticTestSkipButtonClick(): EventEmitter<void> {
    return this._diagnosticTestSkipQuestionEventEmitter;
  }
}

angular.module('oppia').factory('DiagnosticTestPlayerStatusService',
  downgradeInjectable(DiagnosticTestPlayerStatusService));
