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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class GenerateContentIdService {
  // TODO(#7176): Replace 'any' with the exact type.
  generateIdForComponent(existingComponentIds: any,
      componentName: string): any {
    let contentIdList = JSON.parse(JSON.stringify(existingComponentIds));
    let searchKey = componentName + '_';
    let count = 0;
    for (let contentId in contentIdList) {
      if (contentIdList[contentId].indexOf(searchKey) === 0) {
        let splitContentId = contentIdList[contentId].split('_');
        let tempCount =
            parseInt(splitContentId[splitContentId.length - 1]);
        if (tempCount > count) {
          count = tempCount;
        }
      }
    }
    return (searchKey + String(count + 1));
  }

  // TODO(#7176): Replace 'any' with the exact type.
  _getNextId(existingComponentIds: any, componentName: string): any {
    if (componentName === AppConstants.COMPONENT_NAME_FEEDBACK ||
        componentName === AppConstants.COMPONENT_NAME_HINT ||
        componentName === AppConstants.COMPONENT_NAME_WORKED_EXAMPLE) {
      return this.generateIdForComponent(existingComponentIds, componentName);
    } else {
      throw Error('Unknown component name provided.');
    }
  }

  // TODO(#7176): Replace 'any' with the exact type.
  getNextId(existingComponentIds: any, componentName: string): any {
    return this._getNextId(existingComponentIds, componentName);
  }
}

angular.module('oppia').factory(
  'GenerateContentIdService', downgradeInjectable(GenerateContentIdService));
