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

export interface ILostChangeBackendDict {
  /* eslint-disable camelcase */
  cmd: string;
  new_state_name?: string;
  old_state_name?: string;
  state_name?: string;
  new_value?: any;
  old_value?: any;
  property_name?: string;
  /* eslint-enable camelcase */
}

export class LostChange {
  constructor(
      private utilsService: UtilsService,
      public cmd: string,
      public newStateName?: string,
      public oldStateName?: string,
      public stateName?: string,
      public newValue?: any,
      public oldValue?: any,
      public propertyName?: string) {}

  // An edit is represented either as an object or an array. If it's an
  // object, then simply return that object. In case of an array, return
  // the last item.
  getStatePropertyValue(
      statePropertyValue: string[] | object): string | object {
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
    const newFeedback = this.newValue.outcome && this.newValue.outcome.feedback;
    const oldFeedback = this.oldValue.outcome && this.oldValue.outcome.feedback;
    return (
      oldFeedback && newFeedback &&
      newFeedback.getHtml() === oldFeedback.getHtml());
  }

  isOutcomeDestEqual(): boolean {
    return (
      this.newValue.outcome && this.oldValue.outcome &&
      this.oldValue.outcome.dest === this.newValue.outcome.dest);
  }

  isDestEqual(): boolean {
    return this.oldValue.dest === this.newValue.dest;
  }

  isFeedbackEqual(): boolean {
    return (
      this.newValue.feedback && this.oldValue.feedback &&
      this.newValue.feedback.getHtml() === this.oldValue.feedback.getHtml());
  }

  isRulesEqual(): boolean {
    return isEqual(this.newValue.rules, this.oldValue.rules);
  }

  // Detects whether an object of the type 'answer_group' or
  // 'default_outcome' has been added, edited or deleted.
  // Returns - 'addded', 'edited' or 'deleted' accordingly.
  getRelativeChangeToGroups(): string {
    if (Array.isArray(this.newValue) && Array.isArray(this.oldValue)) {
      if (this.newValue.length > this.oldValue.length) {
        return 'added';
      } else if (this.newValue.length === this.oldValue.length) {
        return 'edited';
      } else {
        return 'deleted';
      }
    } else {
      if (!this.utilsService.isEmpty(this.oldValue)) {
        if (!this.utilsService.isEmpty(this.newValue)) {
          return 'edited';
        } else {
          return 'deleted';
        }
      } else if (!this.utilsService.isEmpty(this.newValue)) {
        return 'added';
      }
    }
    return '';
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
   */
  createNew(lostChangeDict: ILostChangeBackendDict): LostChange {
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
