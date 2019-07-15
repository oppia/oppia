// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for keeping track of solution validity.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class SolutionValidityService {
  solutionValidities = {};
  init(stateNames) {
    stateNames.forEach((stateName) => {
      this.solutionValidities[stateName] = true;
    });
  }
  deleteSolutionValidity(stateName) {
    delete this.solutionValidities[stateName];
  }
  onRenameState(newStateName, oldStateName) {
    this.solutionValidities[newStateName] =
      this.solutionValidities[oldStateName];
    this.deleteSolutionValidity(oldStateName);
  }
  updateValidity(stateName, solutionIsValid) {
    this.solutionValidities[stateName] = solutionIsValid;
  }
  isSolutionValid(stateName) {
    if (this.solutionValidities.hasOwnProperty(stateName)) {
      return this.solutionValidities[stateName];
    }
  }
  getAllValidities() {
    return this.solutionValidities;
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'SolutionValidityService', downgradeInjectable(SolutionValidityService));
