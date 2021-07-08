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

import { ParamSpecBackendDict, ParamSpec, ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory';

export interface ParamSpecsBackendDict {
  [paramName: string]: ParamSpecBackendDict;
}

interface ParamDict {
  [paramName: string]: ParamSpec;
}

export class ParamSpecs {
  _paramDict: ParamDict;
  _paramSpecObjectFactory: ParamSpecObjectFactory;

  /**
   * @constructor
   * @param {Object.<String, ParamSpec>} paramDict - params and their specs
   *    for this object will hold.
   */
  constructor(
      paramDict: ParamDict, paramSpecObjectFactory: ParamSpecObjectFactory) {
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
  getParamDict(): ParamDict {
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
  forEach(callback: Function): void {
    var that = this;
    this.getParamNames().forEach((paramName) => {
      callback(paramName, that.getParamSpec(paramName));
    });
  }

  /**
   * @returns {Object.<String, {obj_type: String}>} - Basic dict for backend
   *    consumption.
   */
  toBackendDict(): ParamSpecsBackendDict {
    var paramSpecsBackendDict: ParamSpecsBackendDict = {};
    this.forEach(
      (paramName: string, paramSpec: ParamSpec) => {
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
  createFromBackendDict(
      paramSpecsBackendDict: ParamSpecsBackendDict): ParamSpecs {
    var paramDict: ParamDict = {};
    Object.keys(paramSpecsBackendDict).forEach((paramName) => {
      paramDict[paramName] = this.paramSpecObjectFactory.createFromBackendDict(
        paramSpecsBackendDict[paramName]);
    });
    return new ParamSpecs(paramDict, this.paramSpecObjectFactory);
  }
}

angular.module('oppia').factory(
  'ParamSpecsObjectFactory', downgradeInjectable(ParamSpecsObjectFactory));
