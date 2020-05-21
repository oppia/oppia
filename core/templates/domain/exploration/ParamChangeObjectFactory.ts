// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of ParamChange
 * domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ICustomizationArg, ICustomizationArgs } from
  'domain/state/CustomizationArgsObjectFactory';

var DEFAULT_CUSTOMIZATION_ARGS: ICustomizationArgs = {
  Copier: {
    parse_with_jinja: true,
    value: '5'
  },
  RandomSelector: {
    list_of_values: ['sample value']
  }
};

export interface IParamChangeBackendDict {
  /* eslint-disable camelcase */
  customization_args: ICustomizationArgs;
  generator_id: string;
  name: string;
  /* eslint-enable camelcase */
}

export class ParamChange {
  constructor(
      public customizationArg: ICustomizationArg,
      public generatorId: string,
      public name: string) {}

  toBackendDict(): IParamChangeBackendDict {
    return {
      customization_args: {[this.generatorId]: this.customizationArg},
      generator_id: this.generatorId,
      name: this.name
    };
  }

  resetCustomizationArgs(): void {
    this.customizationArg = cloneDeep(
      DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParamChangeObjectFactory {
  createFromBackendDict(
      paramChangeBackendDict: IParamChangeBackendDict): ParamChange {
    return new ParamChange(
      paramChangeBackendDict.customization_args,
      paramChangeBackendDict.generator_id,
      paramChangeBackendDict.name);
  }

  createEmpty(paramName: string): ParamChange {
    return new ParamChange(
      {parse_with_jinja: true, value: ''}, 'Copier', paramName);
  }

  createDefault(paramName: string): ParamChange {
    return new ParamChange(
      cloneDeep(DEFAULT_CUSTOMIZATION_ARGS.Copier), 'Copier', paramName);
  }
}

angular.module('oppia').factory(
  'ParamChangeObjectFactory', downgradeInjectable(ParamChangeObjectFactory));
