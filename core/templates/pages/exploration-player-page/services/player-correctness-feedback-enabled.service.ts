// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service which sets and determines whether the correctness
 * feedback is enabled or not.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class PlayerCorrectnessFeedbackEnabledService {
  static _correctnessFeedbackIsEnabled: boolean = false;
  static _init(correctnessFeedbackIsEnabled: boolean): void {
    PlayerCorrectnessFeedbackEnabledService._correctnessFeedbackIsEnabled = (
      correctnessFeedbackIsEnabled);
  }

  init(correctnessFeedbackIsEnabled: boolean): void {
    PlayerCorrectnessFeedbackEnabledService._init(correctnessFeedbackIsEnabled);
  }

  isEnabled(): boolean {
    return (
      PlayerCorrectnessFeedbackEnabledService._correctnessFeedbackIsEnabled);
  }
}

angular.module('oppia').factory(
  'PlayerCorrectnessFeedbackEnabledService',
  downgradeInjectable(PlayerCorrectnessFeedbackEnabledService));
