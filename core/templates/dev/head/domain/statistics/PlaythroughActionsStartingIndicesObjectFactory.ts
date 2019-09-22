// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Grouped
 * Starting Indices object.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class PlaythroughActionsStartingIndicesBuilder {
  startingIndices: number[];
  localIndex: number;
  lastIndex: number;
  latestStateName: string;
  /**
   * @constructor
   */
  constructor(lastIndex: number, latestStateName: string) {
    this.startingIndices = [];
    this.localIndex = lastIndex;
    this.latestStateName = latestStateName;
    this.lastIndex = lastIndex;
  }

  /**
   * Updates the local starting index or finalises the current index and
   * start calculating the next stop.
   */
  handleChangeInState(action) {
    this.latestStateName = action.actionCustomizationArgs.state_name.value;
    var diff;
    if (this.startingIndices.length === 0) {
      diff = this.lastIndex - this.localIndex;
    } else {
      diff = this.startingIndices[this.startingIndices.length - 1] -
        this.localIndex;
    }
    // The maximum number of actions in a block that do not belong to the same
    // state should be less than 4.
    if (diff < 4) {
      // Updates local starting index.
      this.localIndex -= 1;
      return;
    }
    // Updates current stop.
    this.startingIndices.push(this.localIndex);
    this.localIndex -= 1;
  }

  /**
   * Updates the local starting index.
   */
  handleSameState() {
    this.localIndex -= 1;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughActionsStartingIndicesBuilderObjectFactory {
  createNew(
      lastIndex: number,
      latestStateName: string): PlaythroughActionsStartingIndicesBuilder {
    return new PlaythroughActionsStartingIndicesBuilder(
      lastIndex, latestStateName);
  }
}

angular.module('oppia').factory(
  'PlaythroughActionsStartingIndicesBuilderObjectFactory',
  downgradeInjectable(PlaythroughActionsStartingIndicesBuilderObjectFactory));
