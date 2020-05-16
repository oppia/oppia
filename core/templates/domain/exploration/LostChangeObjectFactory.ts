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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UtilsService } from 'services/utils.service';
import isEqual from 'lodash/isEqual';

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
      utilsService: UtilsService, cmd: string, newStateName: string,
      oldStateName: string, stateName: string, newValue: any, oldValue: any,
      propertyName: string) {
    this.utilsService = utilsService;
    this.cmd = cmd;
    this.newStateName = newStateName;
    this.oldStateName = oldStateName;
    this.stateName = stateName;
    this.newValue = newValue;
    this.oldValue = oldValue;
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

  isOutcomeFeedbackEqual() {
    if (this.newValue.outcome && this.newValue.outcome.feedback &&
      this.oldValue.outcome && this.oldValue.outcome.feedback) {
      return (
        this.newValue.outcome.feedback.getHtml() ===
        this.oldValue.outcome.feedback.getHtml());
    }
    return false;
  }

  isOutcomeDestEqual() {
    if (this.newValue.outcome && this.oldValue.outcome) {
      return (
        this.oldValue.outcome.dest === this.newValue.outcome.dest);
    }
    return false;
  }

  isDestEqual() {
    return this.oldValue.dest === this.newValue.dest;
  }

  isFeedbackEqual() {
    if (this.newValue.feedback && this.oldValue.feedback) {
      return (
        this.newValue.feedback.getHtml() ===
        this.oldValue.feedback.getHtml());
    }
    return false;
  }

  isRulesEqual() {
    return isEqual(this.newValue.rules, this.oldValue.rules);
  }

  // Detects whether an object of the type 'answer_group' or
  // 'default_outcome' has been added, edited or deleted.
  // Returns - 'addded', 'edited' or 'deleted' accordingly.
  getRelativeChangeToGroups(): string {
    let result = '';

    if (Array.isArray(this.newValue) && Array.isArray(this.oldValue)) {
      if (this.newValue.length > this.oldValue.length) {
        result = 'added';
      } else if (this.newValue.length === this.oldValue.length) {
        result = 'edited';
      } else {
        result = 'deleted';
      }
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
  constructor(private utilsService: UtilsService) {
    // createNew function needs to be binded because it's used a lot in
    // calbacks and then `this` would refer to window instead of the service
    // itself.
    this.createNew = this.createNew.bind(this);
  }

  /**
   * @param {String} lostChangeDict - the name of the type to fetch.
   * @returns {LostChange} - The associated type, if any.
   */
  createNew(lostChangeDict) {
    return new LostChange(
      this.utilsService,
      lostChangeDict.cmd,
      lostChangeDict.new_state_name,
      lostChangeDict.old_state_name,
      lostChangeDict.state_name,
      lostChangeDict.new_value,
      lostChangeDict.old_value,
      lostChangeDict.property_name
    );
  }
}

angular.module('oppia').factory(
  'LostChangeObjectFactory', downgradeInjectable(LostChangeObjectFactory));
