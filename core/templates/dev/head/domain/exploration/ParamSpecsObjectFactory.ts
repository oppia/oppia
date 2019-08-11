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
 * @fileoverview Factory for creating new frontend instances of ParamSpecs
 * domain objects. ParamSpecs map parameter names to the specifications
 * which defines them (represented as ParamSpec objects).
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ParamSpec } from 'domain/exploration/ParamSpecObjectFactory.ts';
import { ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory.ts';

export class ParamSpecs {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_paramDict' is initialized as '{}' and that does not match
  // with the actual type of 'paramDict'.
  _paramDict: any;
  _paramSpecObjectFactory: ParamSpecObjectFactory;
  /**
   * @constructor
   * @param {Object.<String, ParamSpec>} paramDict - params and their specs
   *    for this object will hold.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'paramDict' is initialized as '{}' and that does not match
  // with the actual type of 'paramDict'.
  constructor(
      paramDict: any, paramSpecObjectFactory: ParamSpecObjectFactory) {
    /** @member {Object.<String, ParamSpec>} */
    this._paramDict = paramDict;
    this._paramSpecObjectFactory = paramSpecObjectFactory;
  }

  /**
   * @param {String} paramName - The parameter to fetch.
   * @returns {ParamSpec} - associated to given parameter name.
   */
  getParamSpec(paramName: string): ParamSpec {
    return this._paramDict[paramName];
  }

  /**
   * @returns {Object.<String, ParamSpec>} - the map of params to their specs.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_paramDict' is initialized as '{}' and that does not match
  // with the actual type of 'paramDict'.
  getParamDict(): any {
    return this._paramDict;
  }

  /** @returns {Array.<String>} - The names of the current parameter specs. */
  getParamNames(): string[] {
    return Object.keys(this._paramDict);
  }

  /**
   * Adds a new parameter only if it didn't exist already. Does nothing
   * otherwise.
   *
   * @param {!String} paramName - The parameter to add a spec for.
   * @param {ParamSpec=} paramSpec - The specification of the parameter.
   * @returns {Boolean} - True when the parameter was newly added.
   */
  addParamIfNew(paramName: string, paramSpec: ParamSpec): boolean {
    if (!this._paramDict.hasOwnProperty(paramName)) {
      this._paramDict[paramName] =
        paramSpec || this._paramSpecObjectFactory.createDefault();
      return true;
    }
    return false;
  }

  /**
   * @callback callback - Is passed the name and corresponding ParamSpec of
   *    each parameter in the specs.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'callback' is a method can vary. A definite type needs to
  // be found and assigned.
  forEach(callback: any): void {
    var that = this;
    this.getParamNames().forEach((paramName) => {
      callback(paramName, that.getParamSpec(paramName));
    });
  }

  /**
   * @returns {Object.<String, {obj_type: String}>} - Basic dict for backend
   *    consumption.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'paramSpecsBackendDict' is initialized as '{}' and that does
  // not match with the actual type of 'paramDict'.
  toBackendDict(): any {
    var paramSpecsBackendDict = {};
    this.forEach((paramName, paramSpec) => {
      paramSpecsBackendDict[paramName] = paramSpec.toBackendDict();
    });
    return paramSpecsBackendDict;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParamSpecsObjectFactory {
  constructor(private paramSpecObjectFactory: ParamSpecObjectFactory) {}

  /**
   * @param {!Object.<String, {obj_type: String}>} paramSpecsBackendDict -
   *    Basic dict of backend representation.
   * @returns {ParamSpecs} - An instance with properties from the backend
   *    dict.
   */
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'paramSpecsBackendDict' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  createFromBackendDict(paramSpecsBackendDict: any): ParamSpecs {
    var paramDict = {};
    Object.keys(paramSpecsBackendDict).forEach((paramName) => {
      paramDict[paramName] = this.paramSpecObjectFactory.createFromBackendDict(
        paramSpecsBackendDict[paramName]);
    });
    return new ParamSpecs(paramDict, this.paramSpecObjectFactory);
  }
}

angular.module('oppia').factory(
  'ParamSpecsObjectFactory', downgradeInjectable(ParamSpecsObjectFactory));
