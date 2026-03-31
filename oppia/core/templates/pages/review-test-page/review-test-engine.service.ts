// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for the review tests.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReviewTestEngineService {
  getReviewTestQuestionCount(numOfSkills: number): number {
    // Variable numOfSkills should be a non-negative integer.
    if (numOfSkills < 0) {
      return 0;
    } else if (numOfSkills < 6) {
      return numOfSkills * 3;
    } else if (numOfSkills < 10) {
      return numOfSkills * 2;
    } else {
      return numOfSkills;
    }
  }
}
