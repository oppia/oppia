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
 * @fileoverview Service for generating random IDs.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IdGenerationService {
  generateNewId(): string {
    // Generates random string using the last 10 digits of
    // the string for better entropy.
    let randomString = Math.random().toString(36).slice(2);
    while (randomString.length < 10) {
      randomString = randomString + '0';
    }
    return randomString.slice(-10);
  }
}
