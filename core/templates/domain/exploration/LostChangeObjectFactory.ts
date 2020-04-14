// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of LostChange
 * domain objects.
 */

import isEqual from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UtilsService } from 'services/utils.service';
import { SubtitledHtml } from './SubtitledHtmlObjectFactory';
import { OutcomeObjectFactory } from './OutcomeObjectFactory';
import { AnswerGroupObjectFactory } from './AnswerGroupObjectFactory';

export class LostChange {
  cmd: string;
  stateName: string;
  newStateName: string;
  oldStateName: string;
  // TODO(#7176): Replace 'any' with the exact type.
  newValue: any;
  oldValue: any;
  propertyName: string;
  utilsService: UtilsService;

  // TODO(#7176): Replace 'any' with the exact type.
  constructor(
      utilsService: UtilsService, cmd: string, stateName: string,
      newValue: any, oldValue: any, propertyName: string) {
    this.utilsService = utilsService;
    this.cmd = cmd;
    this.stateName = stateName;
    this.newValue = this.getStatePropertyValue(newValue);
    this.oldValue = this.getStatePropertyValue(oldValue);
    this.propertyName = propertyName;
  }

  // An edit is represented either as an object or an array. If it's an
  // object, then simply return that object. In case of an array, return
  // the last item.
  // TODO(#7176): Replace 'any' with the exact type.
  getStatePropertyValue(statePropertyValue: Array<string> | Object): any {
    return Array.isArray(statePropertyValue) ?
      statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
  }

  isEndingExploration() {
    return this.oldValue === null && this.newValue === 'EndExploration';
  }

  isAddingInteraction() {
    return this.oldValue === null && this.newValue !== 'EndExploration';
  }

  isOldValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.oldValue);
  }

  isNewValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.newValue);
  }

  // Detects whether an object of the type 'answer_group' or
  // 'default_outcome' has been added, edited or deleted.
  // Returns - 'addded', 'edited' or 'deleted' accordingly.
  getRelativeChangeToGroups(): string {
    let result = '';

    if (Array.isArray(this.newValue) &&
      Array.isArray(this.oldValue)) {
      result = (this.newValue.length > this.oldValue.length) ?
        'added' : (this.newValue.length === this.oldValue.length) ?
          'edited' : 'deleted';
    } else {
      if (!this.utilsService.isEmpty(this.oldValue)) {
        if (!this.utilsService.isEmpty(this.newValue)) {
          result = 'edited';
        } else {
          result = 'deleted';
        }
      } else if (!this.utilsService.isEmpty(this.newValue)) {
        result = 'added';
      }
    }
    return result;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LostChangeObjectFactory {
  constructor(private utilsService: UtilsService) {}

  /**
   * @param {String} lostChangeDict - the name of the type to fetch.
   * @returns {LostChange} - The associated type, if any.
   * @throws {Error} - When the given type name isn't registered.
   */
  createNew(lostChangeDict) {
    return new LostChange(
      this.utilsService,
      lostChangeDict.cmd,
      lostChangeDict.state_name,
      lostChangeDict.new_value,
      lostChangeDict.old_value,
      lostChangeDict.property_name
    );
  }
}

angular.module('oppia').factory(
  'LostChangeObjectFactory', downgradeInjectable(LostChangeObjectFactory));
