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
import { SubtitledHtml, SubtitledHtmlBackendDict } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { ExplorationChange } from './exploration-draft.model';
import { InteractionBackendDict } from './InteractionObjectFactory';
import { ParamChangeBackendDict } from './ParamChangeObjectFactory';
import { ParamSpecBackendDict } from './ParamSpecObjectFactory';
import { RecordedVoiceOverBackendDict } from './RecordedVoiceoversObjectFactory';
import { WrittenTranslationsBackendDict } from './WrittenTranslationsObjectFactory';

interface LostChangeValues {
  'outcome'?: Outcome;
  'dest'?: string;
  'feedback'?: SubtitledHtml;
  'rules'?: Object;
  'html'?: string;
}

type LostChangeValue = LostChangeValues | SubtitledHtmlBackendDict |
  InteractionBackendDict | ParamChangeBackendDict[] |
  RecordedVoiceOverBackendDict | WrittenTranslationsBackendDict |
  ParamChangeBackendDict[] | ParamSpecBackendDict | boolean | number | string |
  string[];

// Properties are optional in 'LostChangeBackendDict' because all of them may
// not be present in the dict and may change according to the cmd.
export interface LostChangeBackendDict {
  'cmd': string;
  'new_state_name'?: string;
  'old_state_name'?: string;
  'state_name'?: string;
  'new_value'?: LostChangeValue;
  'old_value'?: LostChangeValue;
  'property_name'?: string;
}

export class LostChange {
  cmd: string;
  stateName: string;
  newStateName: string;
  oldStateName: string;
  newValue: LostChangeValue;
  oldValue: LostChangeValue;
  propertyName: string;
  utilsService: UtilsService;

  constructor(
      utilsService: UtilsService, cmd: string, newStateName: string,
      oldStateName: string, stateName: string, newValue: LostChangeValue,
      oldValue: LostChangeValue, propertyName: string) {
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
      statePropertyValue: string[] | Object): string | Object {
    return Array.isArray(statePropertyValue) ?
      statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
  }

  isEndingExploration(): boolean {
    return this.oldValue === null && this.newValue === 'EndExploration';
  }

  isAddingInteraction(): boolean {
    return this.oldValue === null && this.newValue !== 'EndExploration';
  }

  isOldValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.oldValue);
  }

  isNewValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.newValue);
  }

  isOutcomeFeedbackEqual(): boolean {
    if ((<LostChangeValues> this.newValue).outcome &&
      (<LostChangeValues> this.newValue).outcome.feedback &&
      (<LostChangeValues> this.oldValue).outcome &&
      (<LostChangeValues> this.oldValue).outcome.feedback) {
      return (
        (<LostChangeValues> this.newValue).outcome.feedback.html ===
        (<LostChangeValues> this.oldValue).outcome.feedback.html);
    }
    return false;
  }

  isOutcomeDestEqual(): boolean {
    if ((<LostChangeValues> this.newValue).outcome &&
      (<LostChangeValues> this.oldValue).outcome) {
      return (
        (<LostChangeValues> this.oldValue).outcome.dest ===
        (<LostChangeValues> this.newValue).outcome.dest);
    }
    return false;
  }

  isDestEqual(): boolean {
    return (<LostChangeValues> this.oldValue).dest ===
      (<LostChangeValues> this.newValue).dest;
  }

  isFeedbackEqual(): boolean {
    if ((<LostChangeValues> this.newValue).feedback &&
    (<LostChangeValues> this.oldValue).feedback) {
      return (
        (<LostChangeValues> this.newValue).feedback.html ===
        (<LostChangeValues> this.oldValue).feedback.html);
    }
    return false;
  }

  isRulesEqual(): boolean {
    return isEqual(
      (<LostChangeValues> this.newValue).rules,
      (<LostChangeValues> this.oldValue).rules);
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
  createNew(
      lostChangeDict: ExplorationChange | LostChangeBackendDict): LostChange {
    lostChangeDict = lostChangeDict as unknown as LostChangeBackendDict;
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
