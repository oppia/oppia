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

import * as cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LearnerParamsService {
  private _paramDict = {};
  // TODO(sll): Forbid use of 'answer', 'choices' as possible keys.
  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since 'initParamSpecs' is a dict with ParamSpec type object
  // values which is in AngularJS. Replace this with the exact type once it is
  // upgraded.
  init(initParamSpecs: any): void {
    // The initParamSpecs arg is a dict mapping the parameter names used in
    // the exploration to their default values.
    this._paramDict = cloneDeep(initParamSpecs);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since the return type is a dict with ParamSpec type object
  // values which is in AngularJS. Replace this with the exact type once it is
  // upgraded.
  getValue(paramName: string): any {
    if (!this._paramDict.hasOwnProperty(paramName)) {
      throw 'Invalid parameter name: ' + paramName;
    } else {
      return cloneDeep(this._paramDict[paramName]);
    }
  }

  setValue(paramName: string, newParamValue: string): void {
    // TODO(sll): Currently, all parameters are strings. In the future, we
    // will need to maintain information about parameter types.
    if (!this._paramDict.hasOwnProperty(paramName)) {
      throw 'Cannot set unknown parameter: ' + paramName;
    } else {
      this._paramDict[paramName] = String(newParamValue);
    }
  }

  getAllParams(): {} {
    return cloneDeep(this._paramDict);
  }
}

angular.module('oppia').factory(
  'LearnerParamsService', downgradeInjectable(LearnerParamsService));
