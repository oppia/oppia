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

import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';

interface ILostChangeValues {
  'outcome'?: Outcome;
  'dest'?: string;
  'feedback'?: SubtitledHtml;
  'rules'?: Object;
}

type ILostChangeValue = string | ILostChangeValues;

export class LostChange {
  cmd: string;
  stateName: string;
  newStateName: string;
  oldStateName: string;
  newValue: ILostChangeValue;
  oldValue: ILostChangeValue;
  propertyName: string;
  utilsService: UtilsService;

  constructor(
      utilsService: UtilsService, cmd: string, newStateName: string,
      oldStateName: string, stateName: string, newValue: ILostChangeValue,
      oldValue: ILostChangeValue, propertyName: string) {
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
  getStatePropertyValue(
      statePropertyValue: Array<string> | Object): string | Object {
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
    if ((<ILostChangeValues> this.newValue).outcome &&
      (<ILostChangeValues> this.newValue).outcome.feedback &&
      (<ILostChangeValues> this.oldValue).outcome &&
      (<ILostChangeValues> this.oldValue).outcome.feedback) {
      return (
        (<ILostChangeValues> this.newValue).outcome.feedback.getHtml() ===
        (<ILostChangeValues> this.oldValue).outcome.feedback.getHtml());
    }
    return false;
  }

  isOutcomeDestEqual() {
    if ((<ILostChangeValues> this.newValue).outcome &&
      (<ILostChangeValues> this.oldValue).outcome) {
      return (
        (<ILostChangeValues> this.oldValue).outcome.dest ===
        (<ILostChangeValues> this.newValue).outcome.dest);
    }
    return false;
  }

  isDestEqual() {
    return (<ILostChangeValues> this.oldValue).dest ===
      (<ILostChangeValues> this.newValue).dest;
  }

  isFeedbackEqual() {
    if ((<ILostChangeValues> this.newValue).feedback &&
    (<ILostChangeValues> this.oldValue).feedback) {
      return (
        (<ILostChangeValues> this.newValue).feedback.getHtml() ===
        (<ILostChangeValues> this.oldValue).feedback.getHtml());
    }
    return false;
  }

  isRulesEqual() {
    return isEqual(
      (<ILostChangeValues> this.newValue).rules,
      (<ILostChangeValues> this.oldValue).rules);
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
    // The createNew function needs to be binded because it's used a lot in
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
