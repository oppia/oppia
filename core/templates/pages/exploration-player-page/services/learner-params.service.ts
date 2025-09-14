// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains the current set of parameters for the
 * learner.
 */

import cloneDeep from 'lodash/cloneDeep';

import {Injectable} from '@angular/core';

export interface ExplorationParams {
  [paramName: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class LearnerParamsService {
  private _paramDict: ExplorationParams = {};
  // TODO(sll): Forbid use of 'answer', 'choices' as possible keys.
  init(initParamSpecs: ExplorationParams): void {
    // The initParamSpecs arg is a dict mapping the parameter names used in
    // the exploration to their default values.
    this._paramDict = cloneDeep(initParamSpecs);
  }

  getValue(paramName: string): string {
    if (!this._paramDict.hasOwnProperty(paramName)) {
      throw new Error('Invalid parameter name: ' + paramName);
    } else {
      return cloneDeep(this._paramDict[paramName]);
    }
  }

  setValue(paramName: string, newParamValue: string): void {
    if (!this._paramDict.hasOwnProperty(paramName)) {
      throw new Error('Cannot set unknown parameter: ' + paramName);
    } else {
      this._paramDict[paramName] = String(newParamValue);
    }
  }

  getAllParams(): ExplorationParams {
    return cloneDeep(this._paramDict);
  }
}
