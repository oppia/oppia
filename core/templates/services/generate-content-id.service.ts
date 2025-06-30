// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service for generating random and unique content_id for
 * SubtitledHtml domain objects.
 */

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GenerateContentIdService {
  getNextIndex!: () => number;
  revertUnusedIndexes!: () => void;

  init(getNextIndex: () => number, revertUnusedIndexes: () => void): void {
    this.getNextIndex = getNextIndex;
    this.revertUnusedIndexes = revertUnusedIndexes;
  }

  _getNextStateId(prefix: string): string {
    const contentIdIndex = this.getNextIndex();
    return `${prefix}_${contentIdIndex}`;
  }

  getNextStateId(prefix: string): string {
    return this._getNextStateId(prefix);
  }

  revertUnusedContentIdIndex(): void {
    this.revertUnusedIndexes();
  }
}
