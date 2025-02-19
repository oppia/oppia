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

import {AppConstants} from 'app.constants';

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

  generateIdForComponent(
    existingComponentIds: string[],
    componentName: string
  ): string {
    let contentIdList = JSON.parse(JSON.stringify(existingComponentIds));
    let searchKey = componentName + '_';
    let count = 0;
    for (let contentId in contentIdList) {
      if (contentIdList[contentId].indexOf(searchKey) === 0) {
        let splitContentId = contentIdList[contentId].split('_');
        let tempCount = parseInt(splitContentId[splitContentId.length - 1]);
        if (tempCount > count) {
          count = tempCount;
        }
      }
    }
    return searchKey + String(count + 1);
  }

  _getNextId(existingComponentIds: string[], componentName: string): string {
    // Worked example questions and explanations do not live in the State domain
    // so they do not use next content id index.
    if (
      componentName === AppConstants.COMPONENT_NAME_WORKED_EXAMPLE.QUESTION ||
      componentName === AppConstants.COMPONENT_NAME_WORKED_EXAMPLE.EXPLANATION
    ) {
      return this.generateIdForComponent(existingComponentIds, componentName);
    } else {
      throw new Error('Unknown component name provided.');
    }
  }

  _getNextStateId(prefix: string): string {
    const contentIdIndex = this.getNextIndex();
    return `${prefix}_${contentIdIndex}`;
  }

  getNextId(existingComponentIds: string[], componentName: string): string {
    return this._getNextId(existingComponentIds, componentName);
  }

  getNextStateId(prefix: string): string {
    return this._getNextStateId(prefix);
  }

  revertUnusedContentIdIndex(): void {
    this.revertUnusedIndexes();
  }
}
