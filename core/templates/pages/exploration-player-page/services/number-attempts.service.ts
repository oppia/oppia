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
 * @fileoverview Service to track the number of answer attempts by the learner
 * within a card.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NumberAttemptsService {
  /**
   * Static type variable to store the number of answer attempts
   * by the learner within a card.
   */
  static numberAttempts: number = 0;

  /**
   * Increments the number of answer attempts by the learner by 1.
   */
  submitAttempt(): void {
    NumberAttemptsService.numberAttempts++;
  }

  /**
   * Resets number of answer attempts to 0.
   */
  reset(): void {
    NumberAttemptsService.numberAttempts = 0;
  }

  /**
   * @returns - The number of answer attempts by the learner
   * within a card.
   */
  getNumberAttempts(): number {
    return NumberAttemptsService.numberAttempts;
  }
}
