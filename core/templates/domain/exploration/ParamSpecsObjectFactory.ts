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

import { IParamSpecBackendDict, ParamSpec, ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory';

export interface IParamSpecsBackendDict {
  [paramName: string]: IParamSpecBackendDict;
}

export interface ParamSpecDict {
  [paramName: string]: ParamSpec;
}

export class ParamSpecs {
  constructor(
      private paramSpecObjectFactory: ParamSpecObjectFactory,
      private paramDict: ParamSpecDict) {}

  getParamSpec(paramName: string): ParamSpec {
    return this.paramDict[paramName];
  }

  getParamDict(): ParamSpecDict {
    return this.paramDict;
  }

  getParamNames(): string[] {
    return Object.keys(this.paramDict);
  }

  /**
   * Adds a new parameter only if it didn't exist already. Does nothing
   * otherwise.
   */
  addParamIfNew(paramName: string, paramSpec?: ParamSpec): boolean {
    if (!this.paramDict.hasOwnProperty(paramName)) {
      this.paramDict[paramName] = (
        paramSpec || this.paramSpecObjectFactory.createDefault());
      return true;
    }
    return false;
  }

  /**
   * @callback callback - Passed the name and corresponding ParamSpec of each
   *   parameter in the specs.
   */
  forEach(callback: any): void {
    Object.keys(this.paramDict).forEach(
      paramName => callback(paramName, this.paramDict[paramName]));
  }

  toBackendDict(): IParamSpecsBackendDict {
    const paramSpecsBackendDict = {};
    for (const [name, spec] of Object.entries(this.paramDict)) {
      paramSpecsBackendDict[name] = spec.toBackendDict();
    }
    return paramSpecsBackendDict;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParamSpecsObjectFactory {
  constructor(private paramSpecObjectFactory: ParamSpecObjectFactory) {}

  createFromBackendDict(backendDict: IParamSpecsBackendDict): ParamSpecs {
    var paramDict = {};
    for (const [paramName, paramBackendDict] of Object.entries(backendDict)) {
      paramDict[paramName] = (
        this.paramSpecObjectFactory.createFromBackendDict(paramBackendDict));
    }
    return new ParamSpecs(this.paramSpecObjectFactory, paramDict);
  }
}

angular.module('oppia').factory(
  'ParamSpecsObjectFactory', downgradeInjectable(ParamSpecsObjectFactory));
