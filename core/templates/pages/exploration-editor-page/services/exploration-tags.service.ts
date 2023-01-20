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
 * @fileoverview A data service that stores tags for the exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationPropertyService } from './exploration-property.service';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { ChangeListService } from './change-list.service';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationTagsService extends ExplorationPropertyService {
  propertyName: string = 'tags';
  constructor(
    protected alertsService: AlertsService,
    protected changeListService: ChangeListService,
    protected loggerService: LoggerService
  ) {
    super(alertsService, changeListService, loggerService);
  }

  /**
    *@param {string[]} value - tag array to be normalized
    *(white spaces removed and '+' replaced with ' ')
    *@return {string} -normalized array
  */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  _normalize(value: string[]) {
    for (let i = 0; i < value.length; i++) {
      value[i] = value[i].trim().replace(/\s+/g, ' ');
    }
    // TODO(sll): Prevent duplicate tags from being added.
    return value;
  }

  /**
    *@param {string[]} value -tag array to be matched with TAG_REGEX
    *@return {boolean} -whether or not all tags match TAG_REGEX
  */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  _isValid(value: string[]) {
    // Every tag should match the TAG_REGEX.
    for (let i = 0; i < value.length; i++) {
      let tagRegex = new RegExp(AppConstants.TAG_REGEX);
      if (!value[i].match(tagRegex)) {
        return false;
      }
    }

    return true;
  }
}

angular.module('oppia').factory(
  'ExplorationTagsService', downgradeInjectable(
    ExplorationTagsService));
