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
 * @fileoverview Factory for creating new frontend instances of ParamSpec
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ParamTypeObjectFactory } from
  'domain/exploration/ParamTypeObjectFactory.ts';

export class ParamSpec {
  _objType: any;
  /**
   * @constructor
   * @param {!ParamType} objType - The type of the parameter.
   */
  constructor(objType) {
    /** @member {ParamType} */
    this._objType = objType;
  }

  /** @returns {ParamType} - The type name of the parameter. */
  getType() {
    return this._objType;
  }

  /** @returns {{obj_type: String}} - Basic dict for backend consumption. */
  toBackendDict() {
    return {
      obj_type: this._objType.getName(),
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParamSpecObjectFactory {
  constructor(private paramTypeObjectFactory: ParamTypeObjectFactory) {}
  /**
   * @param {!{obj_type: String}} paramSpecBackendDict - Basic dict from
   *    backend.
   * @returns {ParamSpec} - A new ParamSpec instance.
   */
  createFromBackendDict(paramSpecBackendDict) {
    return new ParamSpec(
      this.paramTypeObjectFactory.getTypeFromBackendName(
        paramSpecBackendDict.obj_type));
  }

  /** @returns {ParamSpec} - A default instance for ParamSpec. */
  createDefault() {
    return new ParamSpec(this.paramTypeObjectFactory.getDefaultType());
  }
}

angular.module('oppia').factory(
  'ParamSpecObjectFactory', downgradeInjectable(ParamSpecObjectFactory));
